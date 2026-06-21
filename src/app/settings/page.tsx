"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Link2,
  RefreshCw,
  Unlink,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import { useData } from "@/context/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { BusinessSettings } from "@/lib/types";

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function SettingsPage() {
  const {
    db,
    setDB,
    sheetUrl,
    syncStatus,
    lastSyncedAt,
    connectSheet,
    refreshFromSheet,
    disconnectSheet,
    backupJSON,
    restoreJSON,
    eraseAll,
    lastBackupAt,
  } = useData();

  const [form, setForm] = useState<BusinessSettings>(db.settings);
  const [prevDbSettings, setPrevDbSettings] = useState(db.settings);
  const [urlInput, setUrlInput] = useState(sheetUrl ?? "");
  const [prevSheetUrl, setPrevSheetUrl] = useState(sheetUrl);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync local form state when the underlying data changes externally
  // (e.g. after "Refresh from Sheet" or "Restore from JSON"), without an effect.
  if (db.settings !== prevDbSettings) {
    setPrevDbSettings(db.settings);
    setForm(db.settings);
  }
  if (sheetUrl !== prevSheetUrl) {
    setPrevSheetUrl(sheetUrl);
    setUrlInput(sheetUrl ?? "");
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(db.settings);

  function saveSettings() {
    setDB((prev) => ({ ...prev, settings: form }));
    toast.success("Business info saved");
  }

  async function handleConnect() {
    if (!urlInput.trim()) return;
    setConnecting(true);
    await connectSheet(urlInput);
    setConnecting(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refreshFromSheet();
    setRefreshing(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setRestoreOpen(true);
    }
    e.target.value = "";
  }

  async function confirmRestore() {
    if (!pendingFile) return;
    try {
      await restoreJSON(pendingFile);
      toast.success("Data restored from backup");
    } catch {
      toast.error("That file isn't a valid backup.");
    } finally {
      setPendingFile(null);
      setRestoreOpen(false);
    }
  }

  const statusText = !sheetUrl
    ? "Not connected. Paste your Apps Script Web App URL below and click Connect."
    : syncStatus === "syncing"
      ? "Syncing with Google Sheet…"
      : syncStatus === "synced"
        ? `Synced — last synced ${formatDateTime(lastSyncedAt) ?? "just now"}`
        : syncStatus === "error"
          ? "Couldn't reach the Sheet. It will retry automatically when you're back online."
          : "Offline — changes are saved on this device and will sync when you're back online.";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Info</CardTitle>
          <CardDescription>
            Shown on bills and used for GST and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-name">Business name</Label>
            <Input
              id="biz-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Chetana Crafts"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-gstin">GSTIN</Label>
            <Input
              id="biz-gstin"
              value={form.gstin}
              onChange={(e) =>
                setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))
              }
              placeholder="24XXXXX0000X1Z5"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-phone">Phone</Label>
            <Input
              id="biz-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="98XXXXXXXX"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="biz-addr">Address</Label>
            <Textarea
              id="biz-addr"
              value={form.addr}
              onChange={(e) => setForm((f) => ({ ...f, addr: e.target.value }))}
              placeholder="Shop address, Rajkot, Gujarat"
              rows={2}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={saveSettings} disabled={!isDirty}>
            <Save className="size-4" />
            Save changes
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Sheet Sync</CardTitle>
          <CardDescription>
            Connect a Google Apps Script Web App URL to back up and sync your
            data to a Google Sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-url">Apps Script Web App URL</Label>
            <Input
              id="sheet-url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleConnect}
              disabled={!urlInput.trim() || connecting}
            >
              <Link2 className="size-4" />
              Connect
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={!sheetUrl || refreshing}
            >
              <RefreshCw
                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh from Sheet
            </Button>
            <Button
              variant="outline"
              onClick={disconnectSheet}
              disabled={!sheetUrl}
            >
              <Unlink className="size-4" />
              Disconnect
            </Button>
          </div>
          <Separator />
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            {syncStatus === "synced" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <WifiOff className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{statusText}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>
            Back up your data, restore a previous backup, or start fresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BackupReminder lastBackupAt={lastBackupAt} />
          <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={backupJSON}>
            <Download className="size-4" />
            Backup as JSON
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Restore from JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              <Trash2 className="size-4" />
              Erase everything
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Erase everything?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes every order, stock item, expense,
                  purchase, online sale, and return stored on this device.
                  Back up first if you want to keep a copy. Your connected
                  Google Sheet is not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    eraseAll();
                    toast.success("All data erased");
                  }}
                >
                  Erase everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces all current data on this device with the contents
              of &ldquo;{pendingFile?.name}&rdquo;. This can&apos;t be undone
              unless you have another backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFile(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BackupReminder({ lastBackupAt }: { lastBackupAt: string | null }) {
  const days = daysSince(lastBackupAt);
  const stale = days === null || days >= 7;

  return (
    <div
      className={
        stale
          ? "flex items-start gap-2 rounded-lg bg-warning/15 px-3 py-2 text-sm text-brand-maroon-dark"
          : "flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
      }
    >
      {stale ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      )}
      <span>
        {lastBackupAt === null
          ? "You haven't backed up your data yet. Since everything lives on this device, a regular JSON backup is the safest way to avoid losing it."
          : days === 0
            ? "Backed up today."
            : `Last backed up ${days} day${days === 1 ? "" : "s"} ago${stale ? " — consider downloading a fresh backup." : "."}`}
      </span>
    </div>
  );
}
