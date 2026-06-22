"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { findStockByCode, resolveVariantCode } from "@/lib/codes";
import { fileToCompressedDataURL } from "@/lib/image";
import { genId } from "@/lib/id";
import { todayISO } from "@/lib/format";
import type { StockItem } from "@/lib/types";

export interface PurchaseVariantInput {
  color: string;
  qty: number;
  cost: number;
  sell: number;
}

export interface PurchaseArticleInput {
  code: string;
  name: string;
  variants: PurchaseVariantInput[];
}

export interface PurchaseSubmission {
  supplier: string;
  city: string;
  date: string;
  tripCost: number;
  photo: string;
  articles: PurchaseArticleInput[];
}

interface VariantRow {
  uid: string;
  color: string;
  qty: string;
  cost: string;
  sell: string;
  // Tracks whether this row's cost/sell was typed directly, so it stops
  // following the article's shared price if the user overrides just this
  // one colour — see updateArticleCost/Sell below.
  costEdited: boolean;
  sellEdited: boolean;
}

interface ArticleRow {
  uid: string;
  code: string;
  name: string;
  // Shared cost/sell for the article — auto-fills every colour added under
  // it, so adding many colours only means picking a swatch and a quantity.
  cost: string;
  sell: string;
  variants: VariantRow[];
}

function emptyVariant(cost = "", sell = "", qty = ""): VariantRow {
  return { uid: genId(), color: "", qty, cost, sell, costEdited: false, sellEdited: false };
}

function emptyArticle(): ArticleRow {
  return { uid: genId(), code: "", name: "", cost: "", sell: "", variants: [emptyVariant()] };
}

interface PurchaseFormProps {
  stock: StockItem[];
  onSubmit: (data: PurchaseSubmission) => void;
}

export function PurchaseForm({ stock, onSubmit }: PurchaseFormProps) {
  const [supplier, setSupplier] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState(todayISO());
  const [tripCost, setTripCost] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [articles, setArticles] = useState<ArticleRow[]>([emptyArticle()]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateArticle(uid: string, patch: Partial<Pick<ArticleRow, "name">>) {
    setArticles((prev) => prev.map((a) => (a.uid === uid ? { ...a, ...patch } : a)));
  }

  // Updates the article's shared price and cascades it into every colour
  // row that hasn't been individually overridden.
  function updateArticleCost(uid: string, cost: string) {
    setArticles((prev) =>
      prev.map((a) =>
        a.uid === uid
          ? { ...a, cost, variants: a.variants.map((v) => (v.costEdited ? v : { ...v, cost })) }
          : a
      )
    );
  }

  function updateArticleSell(uid: string, sell: string) {
    setArticles((prev) =>
      prev.map((a) =>
        a.uid === uid
          ? { ...a, sell, variants: a.variants.map((v) => (v.sellEdited ? v : { ...v, sell })) }
          : a
      )
    );
  }

  function handleCodeChange(uid: string, code: string) {
    const match = code.trim() ? findStockByCode(stock, code) : undefined;
    setArticles((prev) =>
      prev.map((a) => {
        if (a.uid !== uid) return a;
        const next: ArticleRow = { ...a, code };
        if (match && !a.name) next.name = match.name;
        if (match) {
          next.cost = a.cost || String(match.cost);
          next.sell = a.sell || String(match.sell);
        }
        if (match && a.variants.length === 1) {
          const v = a.variants[0];
          next.variants = [
            {
              ...v,
              color: v.color || match.color,
              cost: v.costEdited ? v.cost : v.cost || String(match.cost),
              sell: v.sellEdited ? v.sell : v.sell || String(match.sell),
            },
          ];
        }
        return next;
      })
    );
  }

  function addArticle() {
    setArticles((prev) => [...prev, emptyArticle()]);
  }

  function removeArticle(uid: string) {
    setArticles((prev) => (prev.length > 1 ? prev.filter((a) => a.uid !== uid) : prev));
  }

  function updateVariant(articleUid: string, variantUid: string, patch: Partial<VariantRow>) {
    setArticles((prev) =>
      prev.map((a) =>
        a.uid === articleUid
          ? {
              ...a,
              variants: a.variants.map((v) =>
                v.uid === variantUid
                  ? {
                      ...v,
                      ...patch,
                      ...(patch.cost !== undefined ? { costEdited: true } : {}),
                      ...(patch.sell !== undefined ? { sellEdited: true } : {}),
                    }
                  : v
              ),
            }
          : a
      )
    );
  }

  // New colours start from the article's shared price and a quantity of 1 —
  // the common case when one purchase brings in several colours of the same
  // article, often one piece of each.
  function addVariant(articleUid: string) {
    setArticles((prev) =>
      prev.map((a) =>
        a.uid === articleUid
          ? { ...a, variants: [...a.variants, emptyVariant(a.cost, a.sell, "1")] }
          : a
      )
    );
  }

  function removeVariant(articleUid: string, variantUid: string) {
    setArticles((prev) =>
      prev.map((a) =>
        a.uid === articleUid
          ? { ...a, variants: a.variants.length > 1 ? a.variants.filter((v) => v.uid !== variantUid) : a.variants }
          : a
      )
    );
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      setPhoto(await fileToCompressedDataURL(file));
    } catch {
      toast.error("Could not read that photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  const preparedArticles: PurchaseArticleInput[] = articles
    .map((a) => ({
      code: a.code.trim(),
      name: a.name.trim(),
      variants: a.variants
        .filter((v) => Number(v.qty) > 0)
        .map((v) => ({
          color: v.color,
          qty: Number(v.qty) || 0,
          cost: Number(v.cost) || 0,
          sell: Number(v.sell) || 0,
        })),
    }))
    .filter((a) => a.name !== "" && a.variants.length > 0);

  const canSubmit = supplier.trim() !== "" && preparedArticles.length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      supplier: supplier.trim(),
      city: city.trim(),
      date,
      tripCost: Number(tripCost) || 0,
      photo,
      articles: preparedArticles,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Purchase</CardTitle>
        <CardDescription>
          Each article adds to Stock — existing codes just restock quantity. Set
          Cost/Sell once per article and add a colour at a time (e.g. one piece
          each) — every new colour starts from that shared price.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-supplier">Supplier</Label>
              <Input
                id="p-supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Surat Textiles"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-city">City</Label>
              <Input
                id="p-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Surat"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-date">Date</Label>
              <Input
                id="p-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Label>Articles</Label>
            {articles.map((article) => {
              const isMulti = article.variants.length > 1;
              return (
                <div
                  key={article.uid}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3"
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-[140px_1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Code</Label>
                      <Input
                        value={article.code}
                        onChange={(e) => handleCodeChange(article.uid, e.target.value)}
                        placeholder="Auto"
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Article name</Label>
                      <Input
                        value={article.name}
                        onChange={(e) => updateArticle(article.uid, { name: e.target.value })}
                        placeholder="Bandhani Choli"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArticle(article.uid)}
                      disabled={articles.length === 1}
                      className="justify-self-end"
                    >
                      <Trash2 className="size-4 text-destructive" />
                      <span className="sr-only">Remove article</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Cost/pc (all colours)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={article.cost}
                        onChange={(e) => updateArticleCost(article.uid, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Sell/pc (all colours)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={article.sell}
                        onChange={(e) => updateArticleSell(article.uid, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {article.variants.map((variant, idx) => {
                      const variantCode = resolveVariantCode(
                        article.code.trim(),
                        isMulti,
                        variant.color,
                        idx
                      );
                      const existing = variantCode ? findStockByCode(stock, variantCode) : undefined;
                      return (
                        <div
                          key={variant.uid}
                          className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 p-2.5"
                        >
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Qty</Label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                value={variant.qty}
                                onChange={(e) =>
                                  updateVariant(article.uid, variant.uid, { qty: e.target.value })
                                }
                                placeholder="0"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Cost/pc</Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                value={variant.cost}
                                onChange={(e) =>
                                  updateVariant(article.uid, variant.uid, { cost: e.target.value })
                                }
                                placeholder="0"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Sell/pc</Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                value={variant.sell}
                                onChange={(e) =>
                                  updateVariant(article.uid, variant.uid, { sell: e.target.value })
                                }
                                placeholder="0"
                              />
                            </div>
                            <div className="flex items-end justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(article.uid, variant.uid)}
                                disabled={article.variants.length === 1}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                                <span className="sr-only">Remove colour</span>
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="mb-1 block text-xs text-muted-foreground">
                              Colour
                            </Label>
                            <ColorSwatchPicker
                              value={variant.color}
                              onChange={(v) => updateVariant(article.uid, variant.uid, { color: v })}
                            />
                          </div>
                          {isMulti && (
                            <p className="text-xs text-muted-foreground">
                              Saved as code{" "}
                              <span className="font-medium text-foreground">
                                {variantCode || "—"}
                              </span>
                            </p>
                          )}
                          {existing && (
                            <p className="text-xs text-brand-green">
                              Restocking &ldquo;{existing.name}&rdquo; — current qty {existing.qty}.
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addVariant(article.uid)}
                      className="self-start"
                    >
                      <Plus className="size-3.5" />
                      Add colour
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={addArticle} className="self-start">
              <Plus className="size-4" />
              Add article
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-trip">Trip cost</Label>
              <Input
                id="p-trip"
                type="number"
                inputMode="decimal"
                min="0"
                value={tripCost}
                onChange={(e) => setTripCost(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Logged automatically as a Travel expense.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bill photo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {photo ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt="Bill preview"
                    className="size-16 rounded-md object-cover ring-1 ring-border"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setPhoto("")}>
                    <X className="size-4" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoBusy}
                >
                  <ImagePlus className="size-4" />
                  {photoBusy ? "Processing…" : "Attach photo"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!canSubmit}>
            <Plus className="size-4" />
            Save Purchase
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
