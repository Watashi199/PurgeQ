/**
 * PurgeQ Popup — Supabase-backed.
 *
 * Auth-gated: shows a sign-in splash when no Supabase session is present,
 * otherwise renders the full UI (banlist, export, settings).
 *
 * All ban data is queried via shared/banlist-store which routes through
 * Supabase + RLS. The popup also broadcasts BANLIST_UPDATED to all tabs
 * after a mutation so content scripts on FACEIT refresh instantly.
 */

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import {
  addBan as supabaseAddBan,
  refreshBanlistFromSupabase,
  removeBanById,
  type BanInfo,
} from '../shared/banlist-store';
import {
  getSettings,
  saveSettings,
  type Settings,
} from '../shared/settings';
import {
  signInWithDiscord,
  signOut,
  supabase,
} from '../shared/supabase';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  type Language,
  type StringKey,
  t,
} from '../shared/i18n';

type Tab = 'banlist' | 'share' | 'import' | 'export' | 'settings';

type ShareRole = 'viewer' | 'editor';

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  resolve: (ok: boolean) => void;
}

interface Profile {
  display_name: string;
  discord_id: string;
}

interface MemberRow {
  user_id: string;
  role: ShareRole;
  display_name: string;
  discord_id: string;
  /** Where this membership lives — for "leave" actions on shared lists. */
  banlist_id: string;
  banlist_name: string;
  /** True when this row represents access to a banlist the current user owns. */
  is_in_owned_banlist: boolean;
}

interface InviteLinkRow {
  id: string;
  token: string;
  role: ShareRole;
  used_count: number;
  max_uses: number | null;
  expires_at: string | null;
}

interface OwnedBanlistRow {
  id: string;
  name: string;
}

// Strings used only by the Share tab — kept local to avoid bloating the
// shared i18n module for a section that's still iterating. Falls back to
// English if a language is missing a key.
const SHARE_STRINGS: Record<Language, Record<string, string>> = {
  en: {
    title: 'Share',
    yourMembers: 'Members of your banlist',
    youOwner: 'you · owner',
    role: 'Role',
    remove: 'Remove',
    leave: 'Leave',
    generate: 'Generate invite link',
    activeLinks: 'Active invite links',
    copy: 'Copy',
    copied: 'Copied!',
    revoke: 'Revoke',
    uses: 'used {n} time(s)',
    accept: 'Accept an invitation',
    tokenPlaceholder: 'Paste invite token...',
    join: 'Join',
    joined: 'Joined "{name}"',
    invalidToken: 'Invalid invite token',
    noMembers: 'Just you for now. Generate an invite link to share.',
    noLinks: 'No active invite links.',
    sharedWithYou: 'Banlists shared with you',
    noSharedWithYou: 'None yet.',
    revoked: 'Invite revoked',
    removed: 'Member removed',
    left: 'Left "{name}"',
  },
  fr: {
    title: 'Partage',
    yourMembers: 'Membres de ta banlist',
    youOwner: 'toi · propriétaire',
    role: 'Rôle',
    remove: 'Retirer',
    leave: 'Quitter',
    generate: 'Générer un lien d\'invitation',
    activeLinks: 'Liens d\'invitation actifs',
    copy: 'Copier',
    copied: 'Copié !',
    revoke: 'Révoquer',
    uses: 'utilisé {n} fois',
    accept: 'Accepter une invitation',
    tokenPlaceholder: 'Coller le token d\'invitation...',
    join: 'Rejoindre',
    joined: 'A rejoint « {name} »',
    invalidToken: 'Token d\'invitation invalide',
    noMembers: 'Personne d\'autre pour l\'instant. Génère un lien pour partager.',
    noLinks: 'Aucun lien d\'invitation actif.',
    sharedWithYou: 'Banlists partagées avec toi',
    noSharedWithYou: 'Aucune pour l\'instant.',
    revoked: 'Invitation révoquée',
    removed: 'Membre retiré',
    left: 'A quitté « {name} »',
  },
  'pt-BR': {
    title: 'Compartilhar',
    yourMembers: 'Membros da sua banlist',
    youOwner: 'você · proprietário',
    role: 'Função',
    remove: 'Remover',
    leave: 'Sair',
    generate: 'Gerar link de convite',
    activeLinks: 'Links de convite ativos',
    copy: 'Copiar',
    copied: 'Copiado!',
    revoke: 'Revogar',
    uses: 'usado {n} vez(es)',
    accept: 'Aceitar um convite',
    tokenPlaceholder: 'Cole o token de convite...',
    join: 'Entrar',
    joined: 'Entrou em "{name}"',
    invalidToken: 'Token de convite inválido',
    noMembers: 'Apenas você por enquanto. Gere um link para compartilhar.',
    noLinks: 'Nenhum link de convite ativo.',
    sharedWithYou: 'Banlists compartilhadas com você',
    noSharedWithYou: 'Nenhuma ainda.',
    revoked: 'Convite revogado',
    removed: 'Membro removido',
    left: 'Saiu de "{name}"',
  },
  ru: {
    title: 'Поделиться',
    yourMembers: 'Участники твоей банлисты',
    youOwner: 'ты · владелец',
    role: 'Роль',
    remove: 'Удалить',
    leave: 'Покинуть',
    generate: 'Создать ссылку-приглашение',
    activeLinks: 'Активные приглашения',
    copy: 'Копировать',
    copied: 'Скопировано!',
    revoke: 'Отозвать',
    uses: 'использовано {n} раз',
    accept: 'Принять приглашение',
    tokenPlaceholder: 'Вставь токен приглашения...',
    join: 'Присоединиться',
    joined: 'Присоединился к «{name}»',
    invalidToken: 'Неверный токен',
    noMembers: 'Пока только ты. Создай ссылку, чтобы поделиться.',
    noLinks: 'Активных приглашений нет.',
    sharedWithYou: 'Доступные тебе банлисты',
    noSharedWithYou: 'Пока никаких.',
    revoked: 'Приглашение отозвано',
    removed: 'Участник удалён',
    left: 'Покинул «{name}»',
  },
  tr: {
    title: 'Paylaş',
    yourMembers: 'Banlistinin üyeleri',
    youOwner: 'sen · sahibi',
    role: 'Rol',
    remove: 'Çıkar',
    leave: 'Ayrıl',
    generate: 'Davet bağlantısı oluştur',
    activeLinks: 'Aktif davet bağlantıları',
    copy: 'Kopyala',
    copied: 'Kopyalandı!',
    revoke: 'İptal et',
    uses: '{n} kez kullanıldı',
    accept: 'Bir davet kabul et',
    tokenPlaceholder: 'Davet tokenini yapıştır...',
    join: 'Katıl',
    joined: '"{name}" listesine katıldın',
    invalidToken: 'Geçersiz davet tokeni',
    noMembers: 'Şimdilik sadece sensin. Bir bağlantı oluştur ve paylaş.',
    noLinks: 'Aktif davet bağlantısı yok.',
    sharedWithYou: 'Seninle paylaşılan banlistler',
    noSharedWithYou: 'Henüz yok.',
    revoked: 'Davet iptal edildi',
    removed: 'Üye çıkarıldı',
    left: '"{name}" listesinden ayrıldın',
  },
  es: {
    title: 'Compartir',
    yourMembers: 'Miembros de tu banlist',
    youOwner: 'tú · propietario',
    role: 'Rol',
    remove: 'Eliminar',
    leave: 'Salir',
    generate: 'Generar enlace de invitación',
    activeLinks: 'Enlaces de invitación activos',
    copy: 'Copiar',
    copied: '¡Copiado!',
    revoke: 'Revocar',
    uses: 'usado {n} vez/es',
    accept: 'Aceptar una invitación',
    tokenPlaceholder: 'Pega el token de invitación...',
    join: 'Unirse',
    joined: 'Te uniste a "{name}"',
    invalidToken: 'Token de invitación inválido',
    noMembers: 'Solo tú por ahora. Genera un enlace para compartir.',
    noLinks: 'Sin enlaces de invitación activos.',
    sharedWithYou: 'Banlists compartidas contigo',
    noSharedWithYou: 'Ninguna todavía.',
    revoked: 'Invitación revocada',
    removed: 'Miembro eliminado',
    left: 'Saliste de "{name}"',
  },
  de: {
    title: 'Teilen',
    yourMembers: 'Mitglieder deiner Banlist',
    youOwner: 'du · Besitzer',
    role: 'Rolle',
    remove: 'Entfernen',
    leave: 'Verlassen',
    generate: 'Einladungslink erstellen',
    activeLinks: 'Aktive Einladungen',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    revoke: 'Widerrufen',
    uses: '{n} Mal verwendet',
    accept: 'Einladung annehmen',
    tokenPlaceholder: 'Einladungstoken einfügen...',
    join: 'Beitreten',
    joined: '"{name}" beigetreten',
    invalidToken: 'Ungültiger Einladungstoken',
    noMembers: 'Nur du bisher. Erstelle einen Link zum Teilen.',
    noLinks: 'Keine aktiven Einladungen.',
    sharedWithYou: 'Mit dir geteilte Banlists',
    noSharedWithYou: 'Noch keine.',
    revoked: 'Einladung widerrufen',
    removed: 'Mitglied entfernt',
    left: '"{name}" verlassen',
  },
};

function shareT(lang: Language, key: string, vars?: Record<string, string | number>): string {
  let str = SHARE_STRINGS[lang]?.[key] ?? SHARE_STRINGS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

/**
 * Pull a human-readable message out of whatever was thrown / returned by
 * supabase-js. PostgrestError and AuthError aren't Error instances, so
 * `instanceof Error` misses them and `String(err)` yields "[object Object]".
 */
function errorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: unknown; error_description?: unknown; details?: unknown; hint?: unknown };
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.error_description === 'string' && e.error_description) return e.error_description;
    if (typeof e.details === 'string' && e.details) return e.details;
    if (typeof e.hint === 'string' && e.hint) return e.hint;
    try { return JSON.stringify(err); } catch { /* fall through */ }
  }
  return String(err);
}

function randomToken(): string {
  // 32 hex chars, url-safe. crypto.randomUUID is available in MV3.
  return crypto.randomUUID().replace(/-/g, '');
}

const Icon = {
  Shield: () => (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path stroke="#ff5500" strokeWidth="2"
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path stroke="#ffffff" strokeWidth="2" d="m8 12 3 3 5-5" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Discord: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.073.035c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0c-.164-.395-.405-.874-.617-1.249a.077.077 0 0 0-.073-.035 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.245.197.372.291a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.42-2.157 2.42z"/>
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  GitHub: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-1.92c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.35.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.17a10.9 10.9 0 0 1 5.75 0c2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="m12 2.5 3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 18.27l-6.18 3.23L7 14.63l-5-4.87 6.91-1L12 2.5Z"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M18.244 2H21l-6.522 7.452L22 22h-6.828l-4.77-6.234L4.8 22H2l7.07-8.078L2 2h6.914l4.302 5.69L18.244 2Zm-1.197 18h1.62L7.04 3.93H5.3l11.747 16.07Z"/>
    </svg>
  ),
};

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 65%, 50%)`;
}

function formatDate(iso: string, lang: Language): string {
  try {
    return new Date(iso).toLocaleDateString(lang, {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '';
  }
}

const PopupApp: React.FC = () => {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<Tab>('banlist');
  const [banlist, setBanlist] = useState<BanInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [newBan, setNewBan] = useState({ faceit_name: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<Settings>({
    defaultAuthor: '',
    language: DEFAULT_LANGUAGE,
  });
  const [draftSettings, setDraftSettings] = useState<Settings>({
    defaultAuthor: '',
    language: DEFAULT_LANGUAGE,
  });
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  // Share tab state
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteLinkRow[]>([]);
  const [ownedBanlist, setOwnedBanlist] = useState<OwnedBanlistRow | null>(null);
  const [inviteRole, setInviteRole] = useState<ShareRole>('viewer');
  const [acceptTokenInput, setAcceptTokenInput] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const sst = (key: string, vars?: Record<string, string | number>) =>
    shareT(settings.language, key, vars);

  const tr = (key: StringKey, vars?: Record<string, string | number>) =>
    t(key, settings.language, vars);

  // ─── Auth bootstrap ───
  useEffect(() => {
    (async () => {
      try {
        const stored = await getSettings();
        setSettings(stored);
        setDraftSettings(stored);

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        if (initialSession) {
          await loadProfile();
          await loadBanlist();
        }
      } finally {
        setAuthLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (!newSession) {
          setProfile(null);
          setBanlist([]);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Auto-clear toasts.
  useEffect(() => {
    if (!error && !success) return;
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [error, success]);

  function askConfirm(title: string, message: string, confirmLabel?: string): Promise<boolean> {
    return new Promise((resolve) => {
      setConfirmRequest({ title, message, confirmLabel, resolve });
    });
  }

  function settleConfirm(value: boolean) {
    if (!confirmRequest) return;
    confirmRequest.resolve(value);
    setConfirmRequest(null);
  }

  function notifyTabsBanlistChanged() {
    try {
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (tab.id == null) continue;
          chrome.tabs.sendMessage(tab.id, { type: 'BANLIST_UPDATED' }, () => {
            void chrome.runtime.lastError;
          });
        }
      });
    } catch {
      // Extension reloaded mid-session.
    }
  }

  // ─── Data loaders ───
  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, discord_id')
      .maybeSingle();
    if (data) setProfile(data);
  }

  async function loadBanlist() {
    try {
      setLoading(true);
      const map = await refreshBanlistFromSupabase();
      const items = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBanlist(items);
    } catch (err) {
      setError(`Failed to load banlist: ${errorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // ─── Share data loaders ───

  /**
   * Pulls everything the Share tab needs: the user's owned banlist, the
   * members of that banlist (with their Discord display names via a
   * profiles join), every banlist the user is a member of (for "leave"
   * actions), and active invite links the user has generated.
   *
   * The RLS policies for these tables filter to {own banlists} ∪ {banlists
   * I'm a member of}, so the join naturally only returns what the current
   * user is allowed to see.
   */
  async function loadShareData() {
    const { data: userData } = await supabase.auth.getUser();
    const myId = userData?.user?.id;
    if (!myId) return;

    // Profile might not have been fetched yet if the user clicked Share
    // before the bootstrap effect resolved — refresh it here so the
    // "Members of your banlist" header doesn't render with em-dashes.
    if (!profile) await loadProfile();

    const { data: owned } = await supabase
      .from('banlists')
      .select('id, name')
      .eq('owner_id', myId)
      .maybeSingle();
    setOwnedBanlist(owned ?? null);

    // Step 1: members of MY banlist + banlists shared WITH me, raw.
    // We collect user IDs and banlist IDs we need profiles for, then fetch
    // them in a single second query. PostgREST embeds don't follow the
    // banlist_members → auth.users → profiles indirection automatically.
    const memberRows: MemberRow[] = [];
    const idsToResolve = new Set<string>();

    // Placeholder used when the profiles resolution step doesn't return a
    // match (RLS edge cases / stale data). Better than an em-dash, which
    // reads as "the name is missing on purpose".
    const FALLBACK_NAME = 'User';

    if (owned) {
      const { data: ownedMembers } = await supabase
        .from('banlist_members')
        .select('user_id, role')
        .eq('banlist_id', owned.id);
      for (const m of ownedMembers ?? []) {
        idsToResolve.add(m.user_id);
        memberRows.push({
          user_id: m.user_id,
          role: m.role as ShareRole,
          display_name: FALLBACK_NAME, // overwritten in step 2 on match
          discord_id: '',
          banlist_id: owned.id,
          banlist_name: owned.name,
          is_in_owned_banlist: true,
        });
      }
    }

    const { data: sharedWithMe } = await supabase
      .from('banlist_members')
      .select('role, banlist:banlists(id, name, owner_id)')
      .eq('user_id', myId);
    for (const row of sharedWithMe ?? []) {
      const bl = (row as { banlist?: { id: string; name: string; owner_id: string } | null }).banlist;
      if (!bl) continue;
      idsToResolve.add(bl.owner_id);
      memberRows.push({
        user_id: bl.owner_id,
        role: row.role as ShareRole,
        display_name: FALLBACK_NAME,
        discord_id: '',
        banlist_id: bl.id,
        banlist_name: bl.name,
        is_in_owned_banlist: false,
      });
    }

    // Step 2: resolve all user_ids → profile in one query. RLS lets the
    // current user see profiles of anyone in their banlist family.
    if (idsToResolve.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, discord_id')
        .in('id', Array.from(idsToResolve));
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      for (const row of memberRows) {
        const p = byId.get(row.user_id);
        if (p) {
          row.display_name = p.display_name;
          row.discord_id = p.discord_id;
        }
      }
    }
    setMembers(memberRows);

    // Active invite links I've created (only the shareable kind for now —
    // invitee_discord_id IS NULL — direct invites aren't shown in v1).
    if (owned) {
      const { data: myInvites } = await supabase
        .from('banlist_invites')
        .select('id, token, role, used_count, max_uses, expires_at')
        .eq('banlist_id', owned.id)
        .is('invitee_discord_id', null)
        .order('created_at', { ascending: false });
      setInvites((myInvites ?? []) as InviteLinkRow[]);
    }
  }

  // ─── Share actions ───

  async function generateInviteLink() {
    if (!ownedBanlist) return;
    const { data: userData } = await supabase.auth.getUser();
    const myId = userData?.user?.id;
    if (!myId) return;

    const token = randomToken();
    const { error: insertErr } = await supabase
      .from('banlist_invites')
      .insert({
        banlist_id: ownedBanlist.id,
        token,
        role: inviteRole,
        created_by: myId,
      });
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    await loadShareData();
    setSuccess(sst('copied'));
  }

  async function revokeInvite(id: string) {
    const { error: deleteErr } = await supabase
      .from('banlist_invites')
      .delete()
      .eq('id', id);
    if (deleteErr) {
      setError(deleteErr.message);
      return;
    }
    await loadShareData();
    setSuccess(sst('revoked'));
  }

  async function removeMemberFromOwned(member: MemberRow) {
    const ok = await askConfirm(
      sst('remove'),
      `${member.display_name}?`
    );
    if (!ok) return;
    const { error: deleteErr } = await supabase
      .from('banlist_members')
      .delete()
      .eq('banlist_id', member.banlist_id)
      .eq('user_id', member.user_id);
    if (deleteErr) {
      setError(deleteErr.message);
      return;
    }
    await loadShareData();
    await loadBanlist();
    notifyTabsBanlistChanged();
    setSuccess(sst('removed'));
  }

  async function leaveSharedBanlist(member: MemberRow) {
    const ok = await askConfirm(
      sst('leave'),
      `"${member.banlist_name}"?`
    );
    if (!ok) return;
    const { data: userData } = await supabase.auth.getUser();
    const myId = userData?.user?.id;
    if (!myId) return;
    const { error: deleteErr } = await supabase
      .from('banlist_members')
      .delete()
      .eq('banlist_id', member.banlist_id)
      .eq('user_id', myId);
    if (deleteErr) {
      setError(deleteErr.message);
      return;
    }
    await loadShareData();
    await loadBanlist();
    notifyTabsBanlistChanged();
    setSuccess(sst('left', { name: member.banlist_name }));
  }

  async function handleAcceptInvite() {
    const token = acceptTokenInput.trim();
    if (!token) return;
    try {
      const { data, error: rpcErr } = await supabase.rpc('accept_invite', {
        p_token: token,
      });
      if (rpcErr) throw rpcErr;
      const banlist = data as { name?: string } | null;
      setSuccess(sst('joined', { name: banlist?.name ?? '' }));
      setAcceptTokenInput('');
      await loadShareData();
      await loadBanlist();
      notifyTabsBanlistChanged();
    } catch (err) {
      const msg = errorMessage(err);
      // The "Invalid invite token" case is the only one we localise specially;
      // every other reason (expired, used up, not for you, already-owner) gets
      // surfaced as-is since the RPC's English wording is already user-friendly.
      // We deliberately don't catch on P0001 — it's the generic raise_exception
      // code used by *all* of accept_invite's failure paths now.
      if (msg.toLowerCase().startsWith('invalid invite')) {
        setError(sst('invalidToken'));
      } else {
        setError(msg);
      }
    }
  }

  async function copyTokenToClipboard(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((current) => (current === token ? null : current)), 1500);
    } catch (err) {
      setError(`Copy failed: ${err}`);
    }
  }

  // ─── Auth actions ───
  async function handleSignIn() {
    setError('');
    try {
      setAuthLoading(true);
      await signInWithDiscord();
      // Tell the SW so it refreshes its cache.
      chrome.runtime.sendMessage({ type: 'AUTH_CHANGED' }, () => {
        void chrome.runtime.lastError;
      });
      await loadProfile();
      await loadBanlist();
      notifyTabsBanlistChanged();
    } catch (err) {
      setError(`Sign-in failed: ${errorMessage(err)}`);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    const ok = await askConfirm('Sign out', 'You will need to sign in again to see your banlist.');
    if (!ok) return;
    try {
      await signOut();
      chrome.runtime.sendMessage({ type: 'AUTH_CHANGED' }, () => {
        void chrome.runtime.lastError;
      });
      notifyTabsBanlistChanged();
    } catch (err) {
      setError(`Sign-out failed: ${errorMessage(err)}`);
    }
  }

  // ─── Ban actions ───
  async function handleAddBan(e: React.FormEvent) {
    e.preventDefault();
    const author = settings.defaultAuthor.trim() || profile?.display_name || 'User';
    if (!newBan.faceit_name.trim() || !newBan.reason.trim()) {
      setError(tr('err.allRequired'));
      return;
    }
    try {
      setLoading(true);
      await supabaseAddBan({
        faceit_name: newBan.faceit_name,
        reason: newBan.reason,
        author_name: author,
      });
      setSuccess(tr('notif.added'));
      setNewBan({ faceit_name: '', reason: '' });
      await loadBanlist();
      notifyTabsBanlistChanged();
    } catch (err) {
      setError(`${errorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBan(item: BanInfo) {
    const ok = await askConfirm(
      tr('modal.unbanTitle', { name: item.faceit_name }),
      tr('modal.unbanMessage')
    );
    if (!ok) return;
    try {
      await removeBanById(item.id);
      setSuccess(tr('notif.removed', { name: item.faceit_name }));
      await loadBanlist();
      notifyTabsBanlistChanged();
    } catch (err) {
      setError(`${errorMessage(err)}`);
    }
  }

  async function handleRefresh() {
    try {
      await loadBanlist();
      notifyTabsBanlistChanged();
      setSuccess(tr('notif.refreshed'));
    } catch (err) {
      setError(`${errorMessage(err)}`);
    }
  }

  // ─── Settings ───
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveSettings(draftSettings);
      const refreshed = await getSettings();
      setSettings(refreshed);
      setDraftSettings(refreshed);
      setSuccess(tr('notif.settingsSaved'));
      setTab('banlist');
    } catch (err) {
      setError(`${errorMessage(err)}`);
    }
  }

  function handleResetSettings() {
    setDraftSettings({
      defaultAuthor: '',
      language: settings.language,
    });
  }

  // ─── Import ───

  /**
   * Parse an uploaded JSON or CSV file into the shape import_bans expects:
   * an array of { faceit_name, reason, author_name }. Accepts:
   *
   *   JSON
   *     - ["nick1", "nick2"]                       — bare names
   *     - [{faceit_name: "nick", reason?, author?}] — full objects
   *     - {items: [...]}                            — round-trip from /export
   *
   *   CSV
   *     - first row is the header, must include faceit_name. reason and
   *       author are optional and fall back to "Imported" / user display_name.
   *
   * Returns null on parse failure (caller surfaces an error toast).
   */
  async function parseImportFile(file: File): Promise<{
    rows: { faceit_name: string; reason: string; author_name: string }[];
  } | null> {
    const text = await file.text();
    const defaultAuthor =
      settings.defaultAuthor.trim() || profile?.display_name || 'User';
    const defaultReason = 'Imported';

    if (file.name.toLowerCase().endsWith('.csv')) {
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length === 0) return { rows: [] };
      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const idx = {
        faceit_name: header.indexOf('faceit_name'),
        reason: header.indexOf('reason'),
        author: header.indexOf('author'),
      };
      if (idx.faceit_name < 0) {
        setError('CSV must have a "faceit_name" column');
        return null;
      }
      const rows: { faceit_name: string; reason: string; author_name: string }[] = [];
      for (const line of lines.slice(1)) {
        // Minimal CSV split — handles quoted fields with embedded commas/quotes
        // ("\"\"\" escapes a single quote). Good enough for our own exported
        // files and most spreadsheet output.
        const cells: string[] = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') { inQuotes = false; }
            else { cell += ch; }
          } else {
            if (ch === ',') { cells.push(cell); cell = ''; }
            else if (ch === '"' && cell === '') { inQuotes = true; }
            else { cell += ch; }
          }
        }
        cells.push(cell);
        rows.push({
          faceit_name: (cells[idx.faceit_name] || '').trim(),
          reason: (idx.reason >= 0 ? cells[idx.reason] : '').trim() || defaultReason,
          author_name: (idx.author >= 0 ? cells[idx.author] : '').trim() || defaultAuthor,
        });
      }
      return { rows };
    }

    // JSON path
    let parsed: unknown;
    try { parsed = JSON.parse(text); }
    catch { setError('Could not parse the JSON file'); return null; }

    const items: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : [];
    if (items.length === 0 && !Array.isArray(parsed)) {
      setError('JSON must be an array, or {items: [...]}');
      return null;
    }

    const rows = items.map((item) => {
      if (typeof item === 'string') {
        return { faceit_name: item.trim(), reason: defaultReason, author_name: defaultAuthor };
      }
      const obj = item as Record<string, unknown>;
      const name = String(obj.faceit_name ?? '').trim();
      const reason = String(obj.reason ?? '').trim() || defaultReason;
      const author = String(obj.author ?? obj.author_name ?? '').trim() || defaultAuthor;
      return { faceit_name: name, reason, author_name: author };
    });
    return { rows };
  }

  async function handleImportFile(file: File) {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const parsed = await parseImportFile(file);
      if (!parsed) return;
      if (parsed.rows.length === 0) {
        setError('File contains no rows');
        return;
      }

      const { data, error: rpcErr } = await supabase.rpc('import_bans', {
        p_rows: parsed.rows,
      });
      if (rpcErr) throw rpcErr;

      // The RPC returns a single-row set: [{ imported, skipped }].
      const summary = Array.isArray(data) ? data[0] : data;
      const imported = Number(summary?.imported ?? 0);
      const skipped = Number(summary?.skipped ?? 0);
      const parts = [`${imported} imported`];
      if (skipped > 0) parts.push(`${skipped} skipped`);
      setSuccess(parts.join(', '));

      await loadBanlist();
      notifyTabsBanlistChanged();
      setTab('banlist');
    } catch (err) {
      setError(`Import failed: ${errorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // ─── Export ───
  function handleExport(format: 'json' | 'csv') {
    if (banlist.length === 0) {
      setError(tr('err.emptyExport'));
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    let content: string;
    let mime: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify({
        exported_at: new Date().toISOString(),
        items: banlist.map((b) => ({
          faceit_name: b.faceit_name,
          reason: b.reason,
          author: b.author,
          banlist: b.banlist_name,
          created_at: b.created_at,
        })),
      }, null, 2);
      mime = 'application/json';
      filename = `purgeq-banlist-${stamp}.json`;
    } else {
      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const rows = ['faceit_name,reason,author,banlist,created_at'];
      for (const b of banlist) {
        rows.push([b.faceit_name, b.reason, b.author, b.banlist_name, b.created_at].map(escape).join(','));
      }
      content = rows.join('\n');
      mime = 'text/csv;charset=utf-8';
      filename = `purgeq-banlist-${stamp}.csv`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSuccess(tr('notif.exported', { n: banlist.length, format: format.toUpperCase() }));
  }

  const filteredBanlist = banlist.filter(
    (item) =>
      item.faceit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────── Auth gate ───────────────
  if (authLoading) {
    return (
      <div className="popup-container">
        <main className="main centered">
          <div className="empty">{tr('banlist.loading')}</div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="popup-container">
        <main className="main centered">
          <div className="auth-splash">
            <div className="brand">
              <span className="brand-icon"><Icon.Shield /></span>
              <span className="brand-name">PurgeQ</span>
            </div>
            <p className="page-hint">Sign in with Discord to access your banlist.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="button" className="btn btn-primary" onClick={handleSignIn}>
              <Icon.Discord /> <span>Sign in with Discord</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────── Authenticated UI ───────────────
  return (
    <div className="popup-container">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon"><Icon.Shield /></span>
          <span className="brand-name">PurgeQ</span>
        </div>
        <nav className="nav">
          <button
            className={`nav-item ${tab === 'banlist' ? 'is-active' : ''}`}
            onClick={() => setTab('banlist')}
          >
            <Icon.List /> <span>{tr('nav.banlist')}</span>
          </button>
          <button
            className={`nav-item ${tab === 'share' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('share');
              void loadShareData();
            }}
          >
            <Icon.Users /> <span>{sst('title')}</span>
          </button>
          <button
            className={`nav-item ${tab === 'import' ? 'is-active' : ''}`}
            onClick={() => setTab('import')}
          >
            <Icon.Upload /> <span>{tr('nav.import')}</span>
          </button>
          <button
            className={`nav-item ${tab === 'export' ? 'is-active' : ''}`}
            onClick={() => setTab('export')}
          >
            <Icon.Download /> <span>{tr('nav.export')}</span>
          </button>
          <button
            className={`nav-item ${tab === 'settings' ? 'is-active' : ''}`}
            onClick={() => {
              setDraftSettings(settings);
              setTab('settings');
            }}
          >
            <Icon.Settings /> <span>{tr('nav.settings')}</span>
          </button>
        </nav>
        <div className="sidebar-links">
          <a
            href="https://github.com/Watashi199/PurgeQ"
            target="_blank"
            rel="noreferrer"
            title="GitHub repository"
            className="sidebar-link"
          >
            <Icon.GitHub />
          </a>
          <a
            href="https://github.com/Watashi199/PurgeQ/stargazers"
            target="_blank"
            rel="noreferrer"
            title="Star the repo"
            className="sidebar-link sidebar-link-star"
          >
            <Icon.Star />
          </a>
          <a
            href="https://x.com/Watashi_R6S"
            target="_blank"
            rel="noreferrer"
            title="@Watashi_R6S on X"
            className="sidebar-link"
          >
            <Icon.X />
          </a>
        </div>
        <div className="sidebar-footer">
          {profile && (
            <>
              <div className="footer-label">{tr('footer.signedIn')}</div>
              <div className="footer-value" title={profile.discord_id}>
                {profile.display_name}
              </div>
            </>
          )}
          <div className="footer-value">{tr('footer.banned')}: {banlist.length}</div>
        </div>
      </aside>

      <main className="main">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tab === 'banlist' && (
          <section className="page">
            <h2 className="page-title">{tr('banlist.title')}</h2>

            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon"><Icon.Search /></span>
                <input
                  type="text"
                  className="search-input"
                  placeholder={tr('banlist.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="icon-btn"
                title={tr('banlist.refreshTooltip')}
                onClick={handleRefresh}
                disabled={loading}
              >
                <Icon.Refresh />
              </button>
            </div>

            <div className="banlist">
              {loading ? (
                <div className="empty">{tr('banlist.loading')}</div>
              ) : filteredBanlist.length === 0 ? (
                <div className="empty">
                  {searchQuery ? tr('banlist.noResults') : tr('banlist.empty')}
                </div>
              ) : (
                filteredBanlist.map((item) => (
                  <div key={item.id} className="ban-card">
                    <div
                      className="avatar"
                      style={{ background: avatarColor(item.faceit_name) }}
                    >
                      {item.faceit_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ban-meta">
                      <div className="ban-name">
                        {item.faceit_name}
                        {!item.is_own && (
                          <span className="ban-source" title={`From shared list: ${item.banlist_name}`}>
                            {' '}· {item.banlist_name}
                          </span>
                        )}
                      </div>
                      <div className="ban-line">
                        <span className="muted">{tr('banlist.reasonLabel')}:</span> {item.reason}
                      </div>
                      <div className="ban-line ban-line-meta muted">
                        {tr('banlist.byLabel')}: {item.author} · {formatDate(item.created_at, settings.language)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="delete-btn"
                      title={tr('banlist.deleteTooltip')}
                      onClick={() => handleDeleteBan(item)}
                    >
                      <Icon.Trash />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="add-ban">
              <h3 className="section-title">{tr('addBan.title')}</h3>
              <form onSubmit={handleAddBan} className="form">
                <input
                  type="text"
                  className="input"
                  placeholder={tr('addBan.faceitPlaceholder')}
                  value={newBan.faceit_name}
                  onChange={(e) => setNewBan({ ...newBan, faceit_name: e.target.value })}
                />
                <input
                  type="text"
                  className="input"
                  placeholder={tr('addBan.reasonPlaceholder')}
                  value={newBan.reason}
                  onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {tr('addBan.submit')}
                </button>
              </form>
            </div>
          </section>
        )}

        {tab === 'share' && (
          <section className="page">
            <h2 className="page-title">{sst('title')}</h2>

            {/* Scrollable area — fills the remaining height and overflows
                independently of the pinned "Accept invitation" footer below. */}
            <div className="share-scroll">
              {/* Members of MY banlist (owner view) */}
              {ownedBanlist && (
                <>
                  <h3 className="section-title">{sst('yourMembers')}</h3>
                  <div className="member-list">
                    <div className="member-card">
                      <div
                        className="avatar avatar-sm"
                        style={{
                          background: avatarColor(
                            profile?.display_name || ownedBanlist.name || 'you'
                          ),
                        }}
                      >
                        {(profile?.display_name || ownedBanlist.name || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="member-meta">
                        <div className="member-name">
                          {profile?.display_name || ownedBanlist.name || sst('youOwner').split(' · ')[0]}
                        </div>
                        <div className="member-role muted">{sst('youOwner')}</div>
                      </div>
                    </div>
                    {members
                      .filter((m) => m.is_in_owned_banlist)
                      .map((m) => (
                        <div key={`own-${m.user_id}`} className="member-card">
                          <div className="avatar avatar-sm" style={{ background: avatarColor(m.display_name) }}>
                            {m.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-meta">
                            <div className="member-name">{m.display_name}</div>
                            <div className="member-role muted">{m.role}</div>
                          </div>
                          <button
                            type="button"
                            className="icon-btn"
                            title={sst('remove')}
                            onClick={() => removeMemberFromOwned(m)}
                          >
                            <Icon.Close />
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Generate an invite link — compact form, no separate heading */}
                  <div className="form form-inline share-generate">
                    <select
                      className="input"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as ShareRole)}
                    >
                      <option value="viewer">viewer</option>
                      <option value="editor">editor</option>
                    </select>
                    <button type="button" className="btn btn-primary" onClick={generateInviteLink}>
                      {sst('generate')}
                    </button>
                  </div>

                  {/* Active invite links — only shown when at least one exists */}
                  {invites.length > 0 && (
                    <>
                      <h3 className="section-title section-title-tight">{sst('activeLinks')}</h3>
                      <div className="invite-list">
                        {invites.map((inv) => (
                          <div key={inv.id} className="invite-card">
                            <div className="invite-meta">
                              <code className="invite-token">{inv.token}</code>
                              <div className="invite-sub muted">
                                {inv.role} · {sst('uses', { n: inv.used_count })}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="icon-btn"
                              title={copiedToken === inv.token ? sst('copied') : sst('copy')}
                              onClick={() => copyTokenToClipboard(inv.token)}
                            >
                              <Icon.Copy />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              title={sst('revoke')}
                              onClick={() => revokeInvite(inv.id)}
                            >
                              <Icon.Close />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Banlists shared with me — only shown when non-empty to save space */}
              {members.filter((m) => !m.is_in_owned_banlist).length > 0 && (
                <>
                  <h3 className="section-title section-title-tight">{sst('sharedWithYou')}</h3>
                  <div className="member-list">
                    {members
                      .filter((m) => !m.is_in_owned_banlist)
                      .map((m) => (
                        <div key={`shared-${m.banlist_id}`} className="member-card">
                          <div className="avatar avatar-sm" style={{ background: avatarColor(m.banlist_name) }}>
                            {m.banlist_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-meta">
                            <div className="member-name">{m.banlist_name}</div>
                            <div className="member-role muted">
                              {sst('youOwner').split(' · ')[0]} · {m.role} · {m.display_name}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="icon-btn"
                            title={sst('leave')}
                            onClick={() => leaveSharedBanlist(m)}
                          >
                            <Icon.LogOut />
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            {/* Pinned footer — Accept an invitation by pasting a token. Always
                visible regardless of how much content is in the scroll area. */}
            <div className="share-footer">
              <h3 className="section-title section-title-tight">{sst('accept')}</h3>
              <div className="form form-inline">
                <input
                  type="text"
                  className="input"
                  placeholder={sst('tokenPlaceholder')}
                  value={acceptTokenInput}
                  onChange={(e) => setAcceptTokenInput(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!acceptTokenInput.trim()}
                  onClick={handleAcceptInvite}
                >
                  {sst('join')}
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === 'import' && (
          <section className="page">
            <h2 className="page-title">{tr('import.title')}</h2>
            <p className="page-hint">{tr('import.hint')}</p>

            <label className="dropzone">
              <Icon.Upload />
              <div className="dropzone-title">{tr('import.dropzoneTitle')}</div>
              <div className="dropzone-hint">{tr('import.dropzoneHint')}</div>
              <input
                type="file"
                accept=".json,.csv,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleImportFile(file);
                }}
              />
            </label>

            <div className="hint-block">{tr('import.help')}</div>
          </section>
        )}

        {tab === 'export' && (
          <section className="page">
            <h2 className="page-title">{tr('export.title')}</h2>
            <p className="page-hint">{tr('export.hint')}</p>
            <div className="export-grid">
              <button
                type="button"
                className="export-card"
                onClick={() => handleExport('json')}
                disabled={banlist.length === 0}
              >
                <span className="export-icon"><Icon.Download /></span>
                <span className="export-title">JSON</span>
                <span className="export-sub">{tr('export.entries', { n: banlist.length })}</span>
              </button>
              <button
                type="button"
                className="export-card"
                onClick={() => handleExport('csv')}
                disabled={banlist.length === 0}
              >
                <span className="export-icon"><Icon.Download /></span>
                <span className="export-title">CSV</span>
                <span className="export-sub">{tr('export.entries', { n: banlist.length })}</span>
              </button>
            </div>
            <div className="hint-block">{tr('export.note')}</div>
          </section>
        )}

        {tab === 'settings' && (
          <section className="page">
            <h2 className="page-title">{tr('settings.title')}</h2>
            <form onSubmit={handleSaveSettings} className="settings-form">
              <label className="field">
                <span className="field-label">{tr('settings.authorLabel')}</span>
                <input
                  type="text"
                  className="input"
                  maxLength={32}
                  value={draftSettings.defaultAuthor}
                  placeholder={profile?.display_name ?? ''}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, defaultAuthor: e.target.value })
                  }
                />
                <span className="field-hint">{tr('settings.authorHint')}</span>
              </label>

              <label className="field">
                <span className="field-label">{tr('settings.languageLabel')}</span>
                <select
                  className="input"
                  value={draftSettings.language}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, language: e.target.value as Language })
                  }
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </label>

              <div className="settings-actions">
                <button type="button" className="btn btn-ghost" onClick={handleResetSettings}>
                  {tr('settings.reset')}
                </button>
                <button type="submit" className="btn btn-primary btn-inline">
                  {tr('settings.save')}
                </button>
              </div>
            </form>

            <div className="settings-divider" />

            <div className="settings-account">
              {profile && (
                <div className="account-row">
                  <span className="muted">Signed in as</span>
                  <strong>{profile.display_name}</strong>
                </div>
              )}
              <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
                <Icon.LogOut /> <span>Sign out</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {confirmRequest && (
        <div className="modal-backdrop" onClick={() => settleConfirm(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <span className="modal-icon"><Icon.Shield /></span>
              <span className="modal-title">{confirmRequest.title}</span>
            </div>
            <div className="modal-message">{confirmRequest.message}</div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost btn-inline"
                onClick={() => settleConfirm(false)}
              >
                {tr('modal.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-inline"
                onClick={() => settleConfirm(true)}
                autoFocus
              >
                {confirmRequest.confirmLabel ?? tr('modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<PopupApp />);
