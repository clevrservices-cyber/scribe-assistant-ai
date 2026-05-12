import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, LogOut } from "lucide-react";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name,email,phone,avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? user.email ?? "");
        setPhone(data.phone ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      } else {
        setEmail(user.email ?? "");
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, phone, email });
    if (error) toast.error(error.message);
    else toast.success(t("Profile saved", "บันทึกโปรไฟล์แล้ว"));
  };

  const onAvatar = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    toast.success(t("Photo updated", "อัปเดตรูปแล้ว"));
  };

  const changePassword = async () => {
    if (!user?.email) return;
    const { error: signinErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPw,
    });
    if (signinErr) return toast.error(t("Old password incorrect", "รหัสผ่านเดิมไม่ถูกต้อง"));
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else {
      toast.success(t("Password updated", "อัปเดตรหัสผ่านแล้ว"));
      setPwOpen(false);
      setOldPw("");
      setNewPw("");
    }
  };

  const resetByEmail = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/login",
    });
    if (error) toast.error(error.message);
    else toast.success(t("Reset email sent", "ส่งอีเมลรีเซ็ตแล้ว"));
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold">{t("Profile", "โปรไฟล์")}</h2>

      <Card className="p-5 flex items-center gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative size-20 rounded-full overflow-hidden bg-muted grid place-items-center"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-muted-foreground">
              {(fullName || email).slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="absolute bottom-0 right-0 size-7 grid place-items-center rounded-full bg-primary text-primary-foreground border-2 border-card">
            <Pencil className="size-3" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])}
        />
        <div>
          <p className="font-semibold">{fullName || t("Set your name", "ตั้งชื่อของคุณ")}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="space-y-2">
          <Label>{t("Profile name", "ชื่อโปรไฟล์")}</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("Email address", "ที่อยู่อีเมล")}</Label>
          <Input value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t("Phone number", "เบอร์โทรศัพท์")}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>{t("Language", "ภาษา")}</Label>
          <Select value={lang} onValueChange={(v) => setLang(v as "en" | "th")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="th">ไทย</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setPwOpen(true)}>
            {t("Change login code", "เปลี่ยนรหัสเข้าสู่ระบบ")}
          </Button>
          <Button variant="ghost" onClick={resetByEmail}>
            {t("Forgot?", "ลืม?")}
          </Button>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={save} className="flex-1 bg-gradient-primary">
          {t("Save changes", "บันทึกการเปลี่ยนแปลง")}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => navigate({ to: "/scribe" })}>
          {t("Cancel", "ยกเลิก")}
        </Button>
      </div>

      <Button
        variant="destructive"
        className="w-full"
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/login" });
        }}
      >
        <LogOut className="size-4 mr-2" /> {t("Log out", "ออกจากระบบ")}
      </Button>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Change password", "เปลี่ยนรหัสผ่าน")}</DialogTitle>
            <DialogDescription>
              {t("Enter your current and new password.", "กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่")}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder={t("Current password", "รหัสผ่านปัจจุบัน")}
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t("New password", "รหัสผ่านใหม่")}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <Button onClick={changePassword} className="w-full bg-gradient-primary">
            {t("Update password", "อัปเดตรหัสผ่าน")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
