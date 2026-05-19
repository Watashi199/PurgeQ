/**
 * Lightweight i18n. No external dep — just a frozen dictionary per language
 * and a `t()` helper that falls back to English if a key is missing.
 *
 * To add a language: extend the `Language` union, drop a new block in
 * `translations`, and add it to `LANGUAGES`.
 */

export type Language = 'en' | 'fr' | 'pt-BR' | 'ru' | 'tr' | 'es' | 'de';

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
];

export const DEFAULT_LANGUAGE: Language = 'en';

export type StringKey =
  // Sidebar
  | 'nav.banlist' | 'nav.import' | 'nav.export' | 'nav.settings'
  | 'footer.server' | 'footer.banned' | 'footer.signedIn'
  // Banlist
  | 'banlist.title' | 'banlist.searchPlaceholder' | 'banlist.loading'
  | 'banlist.noResults' | 'banlist.empty'
  | 'banlist.reasonLabel' | 'banlist.byLabel'
  | 'banlist.deleteTooltip' | 'banlist.editTooltip'
  | 'banlist.refreshTooltip' | 'banlist.importShortcutTooltip'
  // Add form
  | 'addBan.title' | 'addBan.faceitPlaceholder' | 'addBan.reasonPlaceholder'
  | 'addBan.submit'
  // Import
  | 'import.title' | 'import.hint' | 'import.dropzoneTitle'
  | 'import.dropzoneHint' | 'import.help'
  // Export
  | 'export.title' | 'export.hint' | 'export.entries' | 'export.note'
  // Settings
  | 'settings.title' | 'settings.urlLabel' | 'settings.urlHint'
  | 'settings.keyLabel' | 'settings.keyHint' | 'settings.getKey'
  | 'settings.authorLabel' | 'settings.authorHint'
  | 'settings.languageLabel'
  | 'settings.reset' | 'settings.test' | 'settings.save'
  | 'settings.signedInAs' | 'settings.signOut'
  | 'settings.yourData' | 'settings.yourDataHint'
  | 'settings.exportData' | 'settings.deleteAccount'
  // Modal
  | 'modal.unbanTitle' | 'modal.unbanMessage'
  | 'modal.cancel' | 'modal.confirm'
  | 'modal.signOutTitle' | 'modal.signOutMessage'
  | 'modal.deleteTitle' | 'modal.deleteMessage' | 'modal.deleteForever'
  // Notifications
  | 'notif.added' | 'notif.removed' | 'notif.refreshed'
  | 'notif.settingsSaved' | 'notif.connected' | 'notif.exported'
  | 'notif.accountExported' | 'notif.accountDeleted'
  | 'notif.imported' | 'notif.skipped' | 'notif.importCapped'
  | 'notif.edited'
  // Errors
  | 'err.allRequired' | 'err.noApiKey' | 'err.noAuthor' | 'err.emptyExport'
  | 'err.unreachable' | 'err.permDenied'
  | 'err.freeTierLimit' | 'err.seatLimit'
  | 'err.csvMissingColumn' | 'err.fileEmpty'
  | 'err.jsonParseFailed' | 'err.jsonFormat'
  | 'err.sessionExpired' | 'err.alreadyBanned' | 'err.networkFailed'
  | 'err.fileTooLarge' | 'err.tooManyRows' | 'err.inviteLimit'
  // Paywall
  | 'paywall.title' | 'paywall.desc'
  | 'paywall.feature1' | 'paywall.feature2'
  // Auth
  | 'auth.signInDiscord';

type Dict = Record<StringKey, string>;

const en: Dict = {
  'nav.banlist': 'Banlist',
  'nav.import': 'Import',
  'nav.export': 'Export',
  'nav.settings': 'Settings',
  'footer.server': 'Server',
  'footer.banned': 'Banned',
  'footer.signedIn': 'Signed in',

  'banlist.title': 'Banlist',
  'banlist.searchPlaceholder': 'Search by name or reason...',
  'banlist.loading': 'Loading...',
  'banlist.noResults': 'No results found',
  'banlist.empty': 'No banned players yet',
  'banlist.reasonLabel': 'Reason',
  'banlist.byLabel': 'By',
  'banlist.deleteTooltip': 'Remove from banlist',
  'banlist.editTooltip': 'Edit reason',
  'banlist.refreshTooltip': 'Refresh',
  'banlist.importShortcutTooltip': 'Import a banlist',

  'addBan.title': 'Add to banlist',
  'addBan.faceitPlaceholder': 'FACEIT username',
  'addBan.reasonPlaceholder': 'Reason',
  'addBan.submit': 'Add Ban',

  'import.title': 'Import',
  'import.hint': 'Bulk-import a list of FACEIT names from a JSON or CSV file. Existing entries are skipped automatically.',
  'import.dropzoneTitle': 'Choose a file',
  'import.dropzoneHint': '.json or .csv (max 1000 names)',
  'import.help': 'JSON: an array of names or full objects. CSV: first row must be a header. Author defaults to the value set in Settings.',

  'export.title': 'Export',
  'export.hint': 'Download the current banlist as a JSON or CSV file. The JSON format round-trips through Import; the CSV is convenient for spreadsheets.',
  'export.entries': '{n} entries',
  'export.note': 'The file lands in your usual download folder. Re-importing it later restores the same names. Duplicates will be skipped.',

  'settings.title': 'Settings',
  'settings.urlLabel': 'API server URL',
  'settings.urlHint': 'Examples: http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'API key',
  'settings.keyHint': 'Required to add or remove bans. Stored locally.',
  'settings.getKey': 'Get a key with Discord',
  'settings.authorLabel': 'Default author',
  'settings.authorHint': 'Used as the "author" when you click the inline ban button on a player card.',
  'settings.languageLabel': 'Language',
  'settings.reset': 'Reset',
  'settings.test': 'Test connection',
  'settings.save': 'Save',
  'settings.signedInAs': 'Signed in as',
  'settings.signOut': 'Sign out',
  'settings.yourData': 'Your data',
  'settings.yourDataHint': 'Export everything we have about you, or delete your account permanently. Required by GDPR, no questions asked.',
  'settings.exportData': 'Export my data',
  'settings.deleteAccount': 'Delete account',

  'modal.unbanTitle': 'Unban {name}',
  'modal.unbanMessage': 'This player will no longer be highlighted on FACEIT pages.',
  'modal.cancel': 'Cancel',
  'modal.confirm': 'Confirm',
  'modal.signOutTitle': 'Sign out',
  'modal.signOutMessage': 'You will need to sign in again to see your banlist.',
  'modal.deleteTitle': 'Delete your account?',
  'modal.deleteMessage': 'This permanently removes your account, your banlist, every ban you added and every membership / invite. This cannot be undone.',
  'modal.deleteForever': 'Delete forever',

  'notif.added': 'Player added to banlist',
  'notif.removed': '{name} removed from banlist',
  'notif.refreshed': 'Banlist refreshed',
  'notif.settingsSaved': 'Settings saved',
  'notif.connected': 'Connected to {url}',
  'notif.exported': 'Exported {n} entries as {format}',
  'notif.accountExported': 'Account export downloaded',
  'notif.accountDeleted': 'Account deleted',
  'notif.imported': '{imported} imported',
  'notif.skipped': '{skipped} skipped',
  'notif.importCapped': '{capped} blocked by free tier limit',
  'notif.edited': 'Reason updated',

  'err.allRequired': 'All fields are required',
  'err.noApiKey': 'API key is not set. Open Settings to configure it.',
  'err.noAuthor': 'Set a default author in Settings first.',
  'err.emptyExport': 'Banlist is empty, nothing to export.',
  'err.unreachable': 'Could not reach the API at {url}.',
  'err.permDenied': 'You don\'t have permission to do this.',
  'err.freeTierLimit': 'Free tier limit reached (250). Upgrade to Pro for unlimited entries.',
  'err.seatLimit': 'Seat limit reached (5 members max).',
  'err.csvMissingColumn': 'CSV must have a "faceit_name" column.',
  'err.fileEmpty': 'File contains no rows.',
  'err.jsonParseFailed': 'Could not read the file. Make sure it\'s a valid JSON.',
  'err.jsonFormat': 'JSON must be an array of names, or an object with an "items" array.',
  'err.sessionExpired': 'Session expired. Please sign in again.',
  'err.alreadyBanned': 'This player is already in your banlist.',
  'err.networkFailed': 'Connection failed. Check your internet.',
  'err.fileTooLarge': 'File is too large (5 MB max).',
  'err.tooManyRows': 'File contains too many rows (5 000 max).',
  'err.inviteLimit': 'Invite limit reached (10 active links max).',

  'paywall.title': 'Team workspace',
  'paywall.desc': 'Share your banlist with up to 5 teammates, manage roles, and keep everyone in sync.',
  'paywall.feature1': 'Shared team workspace · up to 5 seats',
  'paywall.feature2': 'Per-member attribution on every ban',
  'auth.signInDiscord': 'Sign in with Discord',
};

const fr: Dict = {
  'nav.banlist': 'Banlist',
  'nav.import': 'Import',
  'nav.export': 'Export',
  'nav.settings': 'Paramètres',
  'footer.server': 'Serveur',
  'footer.banned': 'Bannis',
  'footer.signedIn': 'Connecté',

  'banlist.title': 'Banlist',
  'banlist.searchPlaceholder': 'Chercher par pseudo ou raison...',
  'banlist.loading': 'Chargement...',
  'banlist.noResults': 'Aucun résultat',
  'banlist.empty': 'Aucun joueur banni pour le moment',
  'banlist.reasonLabel': 'Raison',
  'banlist.byLabel': 'Par',
  'banlist.deleteTooltip': 'Retirer de la banlist',
  'banlist.editTooltip': 'Modifier la raison',
  'banlist.refreshTooltip': 'Rafraîchir',
  'banlist.importShortcutTooltip': 'Importer une banlist',

  'addBan.title': 'Ajouter à la banlist',
  'addBan.faceitPlaceholder': 'Pseudo FACEIT',
  'addBan.reasonPlaceholder': 'Raison',
  'addBan.submit': 'Bannir',

  'import.title': 'Import',
  'import.hint': "Importe en masse une liste de pseudos FACEIT depuis un fichier JSON ou CSV. Les doublons sont ignorés automatiquement.",
  'import.dropzoneTitle': 'Choisir un fichier',
  'import.dropzoneHint': '.json ou .csv (max 1000 pseudos)',
  'import.help': "JSON — un tableau de pseudos ou d'objets. CSV — la première ligne doit être un en-tête. L'auteur par défaut vient des Paramètres.",

  'export.title': 'Export',
  'export.hint': 'Télécharge la banlist actuelle en JSON ou CSV. Le format JSON est ré-importable ; le CSV est pratique pour un tableur.',
  'export.entries': '{n} entrées',
  'export.note': 'Le fichier va dans ton dossier Téléchargements. Le ré-importer plus tard restaure la liste — les doublons sont ignorés.',

  'settings.title': 'Paramètres',
  'settings.urlLabel': "URL du serveur API",
  'settings.urlHint': 'Exemples : http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'Clé API',
  'settings.keyHint': 'Nécessaire pour ajouter ou retirer des bans. Stockée localement.',
  'settings.getKey': 'Obtenir une clé via Discord',
  'settings.authorLabel': 'Auteur par défaut',
  'settings.authorHint': 'Utilisé comme « auteur » quand tu cliques sur le bouton Ban sur une carte de joueur.',
  'settings.languageLabel': 'Langue',
  'settings.reset': 'Réinitialiser',
  'settings.test': 'Tester la connexion',
  'settings.save': 'Enregistrer',
  'settings.signedInAs': 'Connecté en tant que',
  'settings.signOut': 'Se déconnecter',
  'settings.yourData': 'Tes données',
  'settings.yourDataHint': 'Exporte tout ce que nous avons sur toi, ou supprime définitivement ton compte. Conformité RGPD — sans condition.',
  'settings.exportData': 'Exporter mes données',
  'settings.deleteAccount': 'Supprimer le compte',

  'modal.unbanTitle': 'Débannir {name}',
  'modal.unbanMessage': "Ce joueur ne sera plus mis en évidence sur les pages FACEIT.",
  'modal.cancel': 'Annuler',
  'modal.confirm': 'Confirmer',
  'modal.signOutTitle': 'Se déconnecter',
  'modal.signOutMessage': 'Tu devras te reconnecter pour voir ta banlist.',
  'modal.deleteTitle': 'Supprimer ton compte ?',
  'modal.deleteMessage': 'Cela supprime définitivement ton compte, ta banlist, tous tes bans et chaque adhésion / invitation. C\'est irréversible.',
  'modal.deleteForever': 'Supprimer définitivement',

  'notif.added': 'Joueur ajouté à la banlist',
  'notif.removed': '{name} retiré de la banlist',
  'notif.refreshed': 'Banlist rafraîchie',
  'notif.settingsSaved': 'Paramètres enregistrés',
  'notif.connected': 'Connecté à {url}',
  'notif.exported': '{n} entrées exportées en {format}',
  'notif.accountExported': 'Export du compte téléchargé',
  'notif.accountDeleted': 'Compte supprimé',
  'notif.imported': '{imported} importés',
  'notif.skipped': '{skipped} ignorés',
  'notif.importCapped': '{capped} bloqués par la limite gratuite',
  'notif.edited': 'Raison mise à jour',

  'err.allRequired': 'Tous les champs sont requis',
  'err.noApiKey': "La clé API n'est pas définie. Ouvre les Paramètres pour la configurer.",
  'err.noAuthor': "Définis d'abord un auteur par défaut dans les Paramètres.",
  'err.emptyExport': 'La banlist est vide, rien à exporter.',
  'err.unreachable': "Impossible d'atteindre l'API à {url}.",
  'err.permDenied': "Tu n'as pas la permission de faire ça.",
  'err.freeTierLimit': 'Limite gratuite atteinte (250). Passe en Pro pour des entrées illimitées.',
  'err.seatLimit': 'Limite de sièges atteinte (5 membres max).',
  'err.csvMissingColumn': 'Le CSV doit avoir une colonne "faceit_name".',
  'err.fileEmpty': 'Le fichier ne contient aucune ligne.',
  'err.jsonParseFailed': 'Impossible de lire le fichier — vérifie que c\'est un JSON valide.',
  'err.jsonFormat': 'Le JSON doit être un tableau de pseudos, ou un objet avec un tableau "items".',
  'err.sessionExpired': 'Session expirée. Reconnecte-toi.',
  'err.alreadyBanned': 'Ce joueur est déjà dans ta banlist.',
  'err.networkFailed': 'Connexion échouée. Vérifie ta connexion internet.',
  'err.fileTooLarge': 'Fichier trop volumineux (5 Mo max).',
  'err.tooManyRows': 'Le fichier contient trop de lignes (5 000 max).',
  'err.inviteLimit': 'Limite d\'invitations atteinte (10 liens actifs max).',

  'paywall.title': "Espace d'équipe",
  'paywall.desc': "Partage ta banlist avec jusqu'à 5 coéquipiers, gère les rôles et garde tout le monde synchronisé.",
  'paywall.feature1': "Espace partagé · jusqu'à 5 membres",
  'paywall.feature2': 'Attribution par membre pour chaque ban',
  'auth.signInDiscord': 'Se connecter avec Discord',
};

const ptBR: Dict = {
  'nav.banlist': 'Banlist',
  'nav.import': 'Importar',
  'nav.export': 'Exportar',
  'nav.settings': 'Configurações',
  'footer.server': 'Servidor',
  'footer.banned': 'Banidos',
  'footer.signedIn': 'Conectado',

  'banlist.title': 'Banlist',
  'banlist.searchPlaceholder': 'Buscar por nome ou motivo...',
  'banlist.loading': 'Carregando...',
  'banlist.noResults': 'Nenhum resultado',
  'banlist.empty': 'Nenhum jogador banido ainda',
  'banlist.reasonLabel': 'Motivo',
  'banlist.byLabel': 'Por',
  'banlist.deleteTooltip': 'Remover da banlist',
  'banlist.editTooltip': 'Editar motivo',
  'banlist.refreshTooltip': 'Atualizar',
  'banlist.importShortcutTooltip': 'Importar uma banlist',

  'addBan.title': 'Adicionar à banlist',
  'addBan.faceitPlaceholder': 'Nome FACEIT',
  'addBan.reasonPlaceholder': 'Motivo',
  'addBan.submit': 'Banir',

  'import.title': 'Importar',
  'import.hint': 'Importe em massa uma lista de nomes FACEIT a partir de um arquivo JSON ou CSV. Duplicatas são ignoradas automaticamente.',
  'import.dropzoneTitle': 'Escolher um arquivo',
  'import.dropzoneHint': '.json ou .csv (máx 1000 nomes)',
  'import.help': 'JSON — uma lista de nomes ou objetos. CSV — a primeira linha deve ser o cabeçalho. O autor padrão vem das Configurações.',

  'export.title': 'Exportar',
  'export.hint': 'Baixe a banlist atual como JSON ou CSV. O formato JSON pode ser reimportado ; o CSV é prático para planilhas.',
  'export.entries': '{n} entradas',
  'export.note': 'O arquivo vai para a pasta de downloads. Reimportá-lo depois restaura a lista — duplicatas são ignoradas.',

  'settings.title': 'Configurações',
  'settings.urlLabel': 'URL do servidor API',
  'settings.urlHint': 'Exemplos: http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'Chave API',
  'settings.keyHint': 'Necessária para adicionar ou remover bans. Armazenada localmente.',
  'settings.getKey': 'Obter uma chave com Discord',
  'settings.authorLabel': 'Autor padrão',
  'settings.authorHint': 'Usado como "autor" quando você clica no botão Ban em uma carta de jogador.',
  'settings.languageLabel': 'Idioma',
  'settings.reset': 'Redefinir',
  'settings.test': 'Testar conexão',
  'settings.save': 'Salvar',
  'settings.signedInAs': 'Conectado como',
  'settings.signOut': 'Sair',
  'settings.yourData': 'Seus dados',
  'settings.yourDataHint': 'Exporte tudo que temos sobre você ou delete sua conta permanentemente. Exigido pelo GDPR — sem perguntas.',
  'settings.exportData': 'Exportar meus dados',
  'settings.deleteAccount': 'Deletar conta',

  'modal.unbanTitle': 'Desbanir {name}',
  'modal.unbanMessage': 'Este jogador não será mais destacado nas páginas do FACEIT.',
  'modal.cancel': 'Cancelar',
  'modal.confirm': 'Confirmar',
  'modal.signOutTitle': 'Sair',
  'modal.signOutMessage': 'Você precisará entrar novamente para ver sua banlist.',
  'modal.deleteTitle': 'Deletar sua conta?',
  'modal.deleteMessage': 'Isso remove permanentemente sua conta, banlist, todos os bans e cada membro / convite. Isso não pode ser desfeito.',
  'modal.deleteForever': 'Deletar para sempre',

  'notif.added': 'Jogador adicionado à banlist',
  'notif.removed': '{name} removido da banlist',
  'notif.refreshed': 'Banlist atualizada',
  'notif.settingsSaved': 'Configurações salvas',
  'notif.connected': 'Conectado a {url}',
  'notif.exported': '{n} entradas exportadas em {format}',
  'notif.accountExported': 'Exportação da conta baixada',
  'notif.accountDeleted': 'Conta deletada',
  'notif.imported': '{imported} importados',
  'notif.skipped': '{skipped} ignorados',
  'notif.importCapped': '{capped} bloqueados pelo limite gratuito',
  'notif.edited': 'Motivo atualizado',

  'err.allRequired': 'Todos os campos são obrigatórios',
  'err.noApiKey': 'Chave API não definida. Abra as Configurações para configurá-la.',
  'err.noAuthor': 'Defina um autor padrão nas Configurações primeiro.',
  'err.emptyExport': 'A banlist está vazia, nada para exportar.',
  'err.unreachable': 'Não foi possível alcançar a API em {url}.',
  'err.permDenied': 'Você não tem permissão para fazer isso.',
  'err.freeTierLimit': 'Limite do plano gratuito atingido (250). Faça upgrade para Pro.',
  'err.seatLimit': 'Limite de membros atingido (5 membros máx.).',
  'err.csvMissingColumn': 'O CSV deve ter uma coluna "faceit_name".',
  'err.fileEmpty': 'O arquivo não contém linhas.',
  'err.jsonParseFailed': 'Não foi possível ler o arquivo — verifique se é um JSON válido.',
  'err.jsonFormat': 'O JSON deve ser um array de nomes, ou um objeto com um array "items".',
  'err.sessionExpired': 'Sessão expirada. Faça login novamente.',
  'err.alreadyBanned': 'Este jogador já está na sua banlist.',
  'err.networkFailed': 'Falha de conexão. Verifique sua internet.',
  'err.fileTooLarge': 'Arquivo muito grande (máx. 5 MB).',
  'err.tooManyRows': 'O arquivo contém muitas linhas (máx. 5 000).',
  'err.inviteLimit': 'Limite de convites atingido (máx. 10 links ativos).',

  'paywall.title': 'Espaço da equipe',
  'paywall.desc': 'Compartilhe sua banlist com até 5 colegas, gerencie funções e mantenha todos sincronizados.',
  'paywall.feature1': 'Espaço colaborativo · até 5 membros',
  'paywall.feature2': 'Atribuição por membro em cada ban',
  'auth.signInDiscord': 'Entrar com Discord',
};

const ru: Dict = {
  'nav.banlist': 'Бан-лист',
  'nav.import': 'Импорт',
  'nav.export': 'Экспорт',
  'nav.settings': 'Настройки',
  'footer.server': 'Сервер',
  'footer.banned': 'Забанено',
  'footer.signedIn': 'Авторизован',

  'banlist.title': 'Бан-лист',
  'banlist.searchPlaceholder': 'Поиск по имени или причине...',
  'banlist.loading': 'Загрузка...',
  'banlist.noResults': 'Ничего не найдено',
  'banlist.empty': 'Пока никто не забанен',
  'banlist.reasonLabel': 'Причина',
  'banlist.byLabel': 'От',
  'banlist.deleteTooltip': 'Удалить из бан-листа',
  'banlist.editTooltip': 'Изменить причину',
  'banlist.refreshTooltip': 'Обновить',
  'banlist.importShortcutTooltip': 'Импортировать бан-лист',

  'addBan.title': 'Добавить в бан-лист',
  'addBan.faceitPlaceholder': 'Никнейм FACEIT',
  'addBan.reasonPlaceholder': 'Причина',
  'addBan.submit': 'Забанить',

  'import.title': 'Импорт',
  'import.hint': 'Массовый импорт списка никнеймов FACEIT из файла JSON или CSV. Дубликаты пропускаются автоматически.',
  'import.dropzoneTitle': 'Выбрать файл',
  'import.dropzoneHint': '.json или .csv (макс. 1000 имён)',
  'import.help': 'JSON — массив имён или объектов. CSV — первая строка должна быть заголовком. Автор по умолчанию берётся из Настроек.',

  'export.title': 'Экспорт',
  'export.hint': 'Скачать текущий бан-лист в JSON или CSV. JSON можно реимпортировать ; CSV удобен для таблиц.',
  'export.entries': 'записей: {n}',
  'export.note': 'Файл сохраняется в папку загрузок. При реимпорте дубликаты пропускаются.',

  'settings.title': 'Настройки',
  'settings.urlLabel': 'URL API сервера',
  'settings.urlHint': 'Примеры: http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'Ключ API',
  'settings.keyHint': 'Нужен для добавления и удаления банов. Хранится локально.',
  'settings.getKey': 'Получить ключ через Discord',
  'settings.authorLabel': 'Автор по умолчанию',
  'settings.authorHint': 'Используется как «автор», когда вы нажимаете Ban на карте игрока.',
  'settings.languageLabel': 'Язык',
  'settings.reset': 'Сбросить',
  'settings.test': 'Проверить соединение',
  'settings.save': 'Сохранить',
  'settings.signedInAs': 'Авторизован как',
  'settings.signOut': 'Выйти',
  'settings.yourData': 'Ваши данные',
  'settings.yourDataHint': 'Экспортируйте все ваши данные или удалите аккаунт навсегда. Требование GDPR — без вопросов.',
  'settings.exportData': 'Экспорт данных',
  'settings.deleteAccount': 'Удалить аккаунт',

  'modal.unbanTitle': 'Разбанить {name}',
  'modal.unbanMessage': 'Этот игрок больше не будет выделяться на страницах FACEIT.',
  'modal.cancel': 'Отмена',
  'modal.confirm': 'Подтвердить',
  'modal.signOutTitle': 'Выйти',
  'modal.signOutMessage': 'Вам нужно будет снова войти, чтобы увидеть бан-лист.',
  'modal.deleteTitle': 'Удалить аккаунт?',
  'modal.deleteMessage': 'Это навсегда удалит ваш аккаунт, бан-лист, все баны, участников и приглашения. Отменить невозможно.',
  'modal.deleteForever': 'Удалить навсегда',

  'notif.added': 'Игрок добавлен в бан-лист',
  'notif.removed': '{name} удалён из бан-листа',
  'notif.refreshed': 'Бан-лист обновлён',
  'notif.settingsSaved': 'Настройки сохранены',
  'notif.connected': 'Подключено к {url}',
  'notif.exported': 'Экспортировано записей: {n} ({format})',
  'notif.accountExported': 'Экспорт аккаунта скачан',
  'notif.accountDeleted': 'Аккаунт удалён',
  'notif.imported': 'Импортировано: {imported}',
  'notif.skipped': 'Пропущено: {skipped}',
  'notif.importCapped': 'Заблокировано лимитом: {capped}',
  'notif.edited': 'Причина обновлена',

  'err.allRequired': 'Все поля обязательны',
  'err.noApiKey': 'Ключ API не задан. Откройте Настройки для конфигурации.',
  'err.noAuthor': 'Сначала задайте автора по умолчанию в Настройках.',
  'err.emptyExport': 'Бан-лист пуст, экспортировать нечего.',
  'err.unreachable': 'Не удалось подключиться к API по адресу {url}.',
  'err.permDenied': 'У вас нет прав на это действие.',
  'err.freeTierLimit': 'Достигнут бесплатный лимит (250). Перейдите на Pro для неограниченных записей.',
  'err.seatLimit': 'Достигнут лимит мест (макс. 5 участников).',
  'err.csvMissingColumn': 'В CSV должен быть столбец "faceit_name".',
  'err.fileEmpty': 'Файл не содержит строк.',
  'err.jsonParseFailed': 'Не удалось прочитать файл — убедитесь, что это корректный JSON.',
  'err.jsonFormat': 'JSON должен быть массивом имён или объектом с массивом "items".',
  'err.sessionExpired': 'Сессия истекла. Войдите снова.',
  'err.alreadyBanned': 'Этот игрок уже в вашем бан-листе.',
  'err.networkFailed': 'Ошибка соединения. Проверьте интернет.',
  'err.fileTooLarge': 'Файл слишком большой (макс. 5 МБ).',
  'err.tooManyRows': 'В файле слишком много строк (макс. 5 000).',
  'err.inviteLimit': 'Достигнут лимит приглашений (макс. 10 активных ссылок).',

  'paywall.title': 'Командное пространство',
  'paywall.desc': 'Поделитесь бан-листом с командой до 5 человек, управляйте ролями и держите всех в курсе.',
  'paywall.feature1': 'Общее пространство · до 5 участников',
  'paywall.feature2': 'Атрибуция по участникам для каждого бана',
  'auth.signInDiscord': 'Войти через Discord',
};

const tr: Dict = {
  'nav.banlist': 'Banlist',
  'nav.import': 'İçe Aktar',
  'nav.export': 'Dışa Aktar',
  'nav.settings': 'Ayarlar',
  'footer.server': 'Sunucu',
  'footer.banned': 'Yasaklı',
  'footer.signedIn': 'Giriş yapıldı',

  'banlist.title': 'Banlist',
  'banlist.searchPlaceholder': 'İsim veya neden ile ara...',
  'banlist.loading': 'Yükleniyor...',
  'banlist.noResults': 'Sonuç yok',
  'banlist.empty': 'Henüz yasaklı oyuncu yok',
  'banlist.reasonLabel': 'Neden',
  'banlist.byLabel': 'Ekleyen',
  'banlist.deleteTooltip': 'Banlistten kaldır',
  'banlist.editTooltip': 'Nedeni düzenle',
  'banlist.refreshTooltip': 'Yenile',
  'banlist.importShortcutTooltip': 'Banlist içe aktar',

  'addBan.title': 'Banliste ekle',
  'addBan.faceitPlaceholder': 'FACEIT kullanıcı adı',
  'addBan.reasonPlaceholder': 'Neden',
  'addBan.submit': 'Yasakla',

  'import.title': 'İçe Aktar',
  'import.hint': 'JSON veya CSV dosyasından toplu FACEIT isim listesi içe aktar. Mevcut girdiler otomatik atlanır.',
  'import.dropzoneTitle': 'Dosya seç',
  'import.dropzoneHint': '.json veya .csv (en fazla 1000 isim)',
  'import.help': 'JSON — isimlerden veya nesnelerden oluşan dizi. CSV — ilk satır başlık olmalı. Varsayılan yazar Ayarlardan alınır.',

  'export.title': 'Dışa Aktar',
  'export.hint': "Mevcut banlist'i JSON veya CSV olarak indir. JSON formatı tekrar içe aktarılabilir ; CSV tablolar için uygundur.",
  'export.entries': '{n} girdi',
  'export.note': 'Dosya indirmeler klasörüne iner. Tekrar içe aktarınca kopyalar atlanır.',

  'settings.title': 'Ayarlar',
  'settings.urlLabel': "API sunucu URL'si",
  'settings.urlHint': 'Örnekler: http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'API anahtarı',
  'settings.keyHint': 'Ban ekleyip kaldırmak için gerekli. Yerel olarak saklanır.',
  'settings.getKey': 'Discord ile anahtar al',
  'settings.authorLabel': 'Varsayılan yazar',
  'settings.authorHint': 'Oyuncu kartındaki ban butonuna tıkladığında "yazar" olarak kullanılır.',
  'settings.languageLabel': 'Dil',
  'settings.reset': 'Sıfırla',
  'settings.test': 'Bağlantıyı test et',
  'settings.save': 'Kaydet',
  'settings.signedInAs': 'Oturum açıldı:',
  'settings.signOut': 'Çıkış yap',
  'settings.yourData': 'Verileriniz',
  'settings.yourDataHint': 'Hakkınızdaki tüm verileri dışa aktarın veya hesabınızı kalıcı olarak silin. GDPR gereği — sorgulanmaz.',
  'settings.exportData': 'Verilerimi dışa aktar',
  'settings.deleteAccount': 'Hesabı sil',

  'modal.unbanTitle': '{name} yasağını kaldır',
  'modal.unbanMessage': 'Bu oyuncu artık FACEIT sayfalarında vurgulanmayacak.',
  'modal.cancel': 'İptal',
  'modal.confirm': 'Onayla',
  'modal.signOutTitle': 'Çıkış yap',
  'modal.signOutMessage': 'Banlistinizi görmek için tekrar giriş yapmanız gerekecek.',
  'modal.deleteTitle': 'Hesabınızı sil?',
  'modal.deleteMessage': 'Bu işlem hesabınızı, banlistinizi, tüm banları ve üyelikleri / davetleri kalıcı olarak siler. Geri alınamaz.',
  'modal.deleteForever': 'Kalıcı olarak sil',

  'notif.added': 'Oyuncu banliste eklendi',
  'notif.removed': '{name} banlistten kaldırıldı',
  'notif.refreshed': 'Banlist yenilendi',
  'notif.settingsSaved': 'Ayarlar kaydedildi',
  'notif.connected': '{url} adresine bağlandı',
  'notif.exported': '{n} girdi {format} olarak dışa aktarıldı',
  'notif.accountExported': 'Hesap dışa aktarma indirildi',
  'notif.accountDeleted': 'Hesap silindi',
  'notif.imported': '{imported} içe aktarıldı',
  'notif.skipped': '{skipped} atlandı',
  'notif.importCapped': '{capped} ücretsiz limit nedeniyle engellendi',
  'notif.edited': 'Neden güncellendi',

  'err.allRequired': 'Tüm alanlar zorunlu',
  'err.noApiKey': 'API anahtarı tanımlı değil. Ayarları açıp girin.',
  'err.noAuthor': "Önce Ayarlar'da varsayılan bir yazar tanımlayın.",
  'err.emptyExport': 'Banlist boş, dışa aktarılacak bir şey yok.',
  'err.unreachable': "{url} adresindeki API'ye ulaşılamadı.",
  'err.permDenied': 'Bu işlem için yetkiniz yok.',
  'err.freeTierLimit': 'Ücretsiz plan sınırına ulaşıldı (250). Sınırsız için Pro\'ya geçin.',
  'err.seatLimit': 'Koltuk sınırına ulaşıldı (en fazla 5 üye).',
  'err.csvMissingColumn': 'CSV\'de "faceit_name" sütunu olmalı.',
  'err.fileEmpty': 'Dosyada satır yok.',
  'err.jsonParseFailed': 'Dosya okunamadı — geçerli bir JSON olduğundan emin olun.',
  'err.jsonFormat': 'JSON bir isim dizisi veya "items" dizisi olan bir nesne olmalı.',
  'err.sessionExpired': 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
  'err.alreadyBanned': 'Bu oyuncu zaten banlistinizde.',
  'err.networkFailed': 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
  'err.fileTooLarge': 'Dosya çok büyük (maks. 5 MB).',
  'err.tooManyRows': 'Dosyada çok fazla satır var (maks. 5 000).',
  'err.inviteLimit': 'Davet sınırına ulaşıldı (maks. 10 aktif bağlantı).',

  'paywall.title': 'Takım alanı',
  'paywall.desc': 'Banlistini 5 takım arkadaşınla paylaş, rolleri yönet ve herkesi senkronda tut.',
  'paywall.feature1': 'Paylaşılan takım alanı · 5 üyeye kadar',
  'paywall.feature2': 'Her ban için üyeye göre atıf',
  'auth.signInDiscord': "Discord ile giriş yap",
};

const es: Dict = {
  'nav.banlist': 'Banlist',
  'nav.import': 'Importar',
  'nav.export': 'Exportar',
  'nav.settings': 'Ajustes',
  'footer.server': 'Servidor',
  'footer.banned': 'Baneados',
  'footer.signedIn': 'Conectado',

  'banlist.title': 'Banlist',
  'banlist.searchPlaceholder': 'Buscar por nombre o motivo...',
  'banlist.loading': 'Cargando...',
  'banlist.noResults': 'Sin resultados',
  'banlist.empty': 'Aún no hay jugadores baneados',
  'banlist.reasonLabel': 'Motivo',
  'banlist.byLabel': 'Por',
  'banlist.deleteTooltip': 'Eliminar de la banlist',
  'banlist.editTooltip': 'Editar motivo',
  'banlist.refreshTooltip': 'Refrescar',
  'banlist.importShortcutTooltip': 'Importar una banlist',

  'addBan.title': 'Añadir a la banlist',
  'addBan.faceitPlaceholder': 'Nombre FACEIT',
  'addBan.reasonPlaceholder': 'Motivo',
  'addBan.submit': 'Banear',

  'import.title': 'Importar',
  'import.hint': 'Importa en masa una lista de nombres de FACEIT desde un archivo JSON o CSV. Las entradas duplicadas se ignoran automáticamente.',
  'import.dropzoneTitle': 'Elegir un archivo',
  'import.dropzoneHint': '.json o .csv (máx. 1000 nombres)',
  'import.help': 'JSON — un array de nombres u objetos. CSV — la primera fila debe ser una cabecera. El autor por defecto se toma de los Ajustes.',

  'export.title': 'Exportar',
  'export.hint': 'Descarga la banlist actual como JSON o CSV. El JSON se puede reimportar ; el CSV va bien para hojas de cálculo.',
  'export.entries': '{n} entradas',
  'export.note': 'El archivo va a tu carpeta de descargas. Al reimportarlo, los duplicados se ignoran.',

  'settings.title': 'Ajustes',
  'settings.urlLabel': 'URL del servidor API',
  'settings.urlHint': 'Ejemplos: http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'Clave API',
  'settings.keyHint': 'Necesaria para añadir o quitar bans. Se guarda localmente.',
  'settings.getKey': 'Obtener una clave con Discord',
  'settings.authorLabel': 'Autor por defecto',
  'settings.authorHint': 'Se usa como "autor" cuando pulsas Ban en la carta de un jugador.',
  'settings.languageLabel': 'Idioma',
  'settings.reset': 'Restablecer',
  'settings.test': 'Probar conexión',
  'settings.save': 'Guardar',
  'settings.signedInAs': 'Conectado como',
  'settings.signOut': 'Cerrar sesión',
  'settings.yourData': 'Tus datos',
  'settings.yourDataHint': 'Exporta todo lo que tenemos sobre ti o borra tu cuenta permanentemente. Obligatorio por GDPR — sin preguntas.',
  'settings.exportData': 'Exportar mis datos',
  'settings.deleteAccount': 'Borrar cuenta',

  'modal.unbanTitle': 'Desbanear a {name}',
  'modal.unbanMessage': 'Este jugador ya no se resaltará en las páginas de FACEIT.',
  'modal.cancel': 'Cancelar',
  'modal.confirm': 'Confirmar',
  'modal.signOutTitle': 'Cerrar sesión',
  'modal.signOutMessage': 'Tendrás que volver a iniciar sesión para ver tu banlist.',
  'modal.deleteTitle': '¿Borrar tu cuenta?',
  'modal.deleteMessage': 'Esto elimina permanentemente tu cuenta, tu banlist, todos los bans y cada membresía / invitación. No se puede deshacer.',
  'modal.deleteForever': 'Borrar para siempre',

  'notif.added': 'Jugador añadido a la banlist',
  'notif.removed': '{name} eliminado de la banlist',
  'notif.refreshed': 'Banlist refrescada',
  'notif.settingsSaved': 'Ajustes guardados',
  'notif.connected': 'Conectado a {url}',
  'notif.exported': '{n} entradas exportadas como {format}',
  'notif.accountExported': 'Exportación de cuenta descargada',
  'notif.accountDeleted': 'Cuenta borrada',
  'notif.imported': '{imported} importados',
  'notif.skipped': '{skipped} omitidos',
  'notif.importCapped': '{capped} bloqueados por el límite gratuito',
  'notif.edited': 'Motivo actualizado',

  'err.allRequired': 'Todos los campos son obligatorios',
  'err.noApiKey': 'No hay clave API. Abre los Ajustes para configurarla.',
  'err.noAuthor': 'Define primero un autor por defecto en Ajustes.',
  'err.emptyExport': 'La banlist está vacía, nada que exportar.',
  'err.unreachable': 'No se ha podido contactar la API en {url}.',
  'err.permDenied': 'No tienes permiso para hacer esto.',
  'err.freeTierLimit': 'Límite gratuito alcanzado (250). Actualiza a Pro para entradas ilimitadas.',
  'err.seatLimit': 'Límite de plazas alcanzado (máx. 5 miembros).',
  'err.csvMissingColumn': 'El CSV debe tener una columna "faceit_name".',
  'err.fileEmpty': 'El archivo no contiene filas.',
  'err.jsonParseFailed': 'No se pudo leer el archivo — asegúrate de que sea un JSON válido.',
  'err.jsonFormat': 'El JSON debe ser un array de nombres, o un objeto con un array "items".',
  'err.sessionExpired': 'Sesión expirada. Por favor inicia sesión de nuevo.',
  'err.alreadyBanned': 'Este jugador ya está en tu banlist.',
  'err.networkFailed': 'Error de conexión. Comprueba tu internet.',
  'err.fileTooLarge': 'Archivo demasiado grande (máx. 5 MB).',
  'err.tooManyRows': 'El archivo contiene demasiadas filas (máx. 5 000).',
  'err.inviteLimit': 'Límite de invitaciones alcanzado (máx. 10 enlaces activos).',

  'paywall.title': 'Espacio de equipo',
  'paywall.desc': 'Comparte tu banlist con hasta 5 compañeros, gestiona roles y mantén a todos sincronizados.',
  'paywall.feature1': 'Espacio de equipo compartido · hasta 5 miembros',
  'paywall.feature2': 'Atribución por miembro en cada ban',
  'auth.signInDiscord': 'Mit Discord anmelden',
};

const de: Dict = {
  'nav.banlist': 'Banlist',
  'nav.import': 'Import',
  'nav.export': 'Export',
  'nav.settings': 'Einstellungen',
  'footer.server': 'Server',
  'footer.banned': 'Gebannt',
  'footer.signedIn': 'Angemeldet',

  'banlist.title': 'Banlist',
  'banlist.searchPlaceholder': 'Nach Name oder Grund suchen...',
  'banlist.loading': 'Lädt...',
  'banlist.noResults': 'Keine Ergebnisse',
  'banlist.empty': 'Noch keine gebannten Spieler',
  'banlist.reasonLabel': 'Grund',
  'banlist.byLabel': 'Von',
  'banlist.deleteTooltip': 'Aus der Banlist entfernen',
  'banlist.editTooltip': 'Grund bearbeiten',
  'banlist.refreshTooltip': 'Aktualisieren',
  'banlist.importShortcutTooltip': 'Banlist importieren',

  'addBan.title': 'Zur Banlist hinzufügen',
  'addBan.faceitPlaceholder': 'FACEIT-Name',
  'addBan.reasonPlaceholder': 'Grund',
  'addBan.submit': 'Bannen',

  'import.title': 'Import',
  'import.hint': 'Massenimport einer Liste von FACEIT-Namen aus einer JSON- oder CSV-Datei. Vorhandene Einträge werden übersprungen.',
  'import.dropzoneTitle': 'Datei auswählen',
  'import.dropzoneHint': '.json oder .csv (max. 1000 Namen)',
  'import.help': 'JSON — ein Array von Namen oder Objekten. CSV — die erste Zeile muss eine Kopfzeile sein. Der Standardautor kommt aus den Einstellungen.',

  'export.title': 'Export',
  'export.hint': 'Lade die aktuelle Banlist als JSON oder CSV herunter. Das JSON-Format kann re-importiert werden ; CSV eignet sich für Tabellenkalkulationen.',
  'export.entries': '{n} Einträge',
  'export.note': 'Die Datei landet im Download-Ordner. Beim erneuten Import werden Duplikate übersprungen.',

  'settings.title': 'Einstellungen',
  'settings.urlLabel': 'API-Server-URL',
  'settings.urlHint': 'Beispiele: http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'API-Schlüssel',
  'settings.keyHint': 'Erforderlich zum Hinzufügen oder Entfernen von Bans. Lokal gespeichert.',
  'settings.getKey': 'Schlüssel via Discord erhalten',
  'settings.authorLabel': 'Standard-Autor',
  'settings.authorHint': 'Wird als "Autor" verwendet, wenn du den Ban-Button auf einer Spielerkarte klickst.',
  'settings.languageLabel': 'Sprache',
  'settings.reset': 'Zurücksetzen',
  'settings.test': 'Verbindung testen',
  'settings.save': 'Speichern',
  'settings.signedInAs': 'Angemeldet als',
  'settings.signOut': 'Abmelden',
  'settings.yourData': 'Deine Daten',
  'settings.yourDataHint': 'Exportiere alles über dich oder lösche deinen Account dauerhaft. DSGVO-konform — keine Fragen gestellt.',
  'settings.exportData': 'Meine Daten exportieren',
  'settings.deleteAccount': 'Account löschen',

  'modal.unbanTitle': '{name} entbannen',
  'modal.unbanMessage': 'Dieser Spieler wird auf FACEIT-Seiten nicht mehr hervorgehoben.',
  'modal.cancel': 'Abbrechen',
  'modal.confirm': 'Bestätigen',
  'modal.signOutTitle': 'Abmelden',
  'modal.signOutMessage': 'Du musst dich erneut anmelden, um deine Banlist zu sehen.',
  'modal.deleteTitle': 'Account löschen?',
  'modal.deleteMessage': 'Dies entfernt dauerhaft deinen Account, deine Banlist, alle Bans und jede Mitgliedschaft / Einladung. Das kann nicht rückgängig gemacht werden.',
  'modal.deleteForever': 'Für immer löschen',

  'notif.added': 'Spieler zur Banlist hinzugefügt',
  'notif.removed': '{name} aus der Banlist entfernt',
  'notif.refreshed': 'Banlist aktualisiert',
  'notif.settingsSaved': 'Einstellungen gespeichert',
  'notif.connected': 'Verbunden mit {url}',
  'notif.exported': '{n} Einträge als {format} exportiert',
  'notif.accountExported': 'Account-Export heruntergeladen',
  'notif.accountDeleted': 'Account gelöscht',
  'notif.imported': '{imported} importiert',
  'notif.skipped': '{skipped} übersprungen',
  'notif.importCapped': '{capped} durch das Freilimit blockiert',
  'notif.edited': 'Grund aktualisiert',

  'err.allRequired': 'Alle Felder sind erforderlich',
  'err.noApiKey': 'API-Schlüssel nicht gesetzt. Öffne die Einstellungen.',
  'err.noAuthor': 'Setze zuerst einen Standard-Autor in den Einstellungen.',
  'err.emptyExport': 'Banlist ist leer, nichts zu exportieren.',
  'err.unreachable': 'API unter {url} nicht erreichbar.',
  'err.permDenied': 'Du hast keine Berechtigung für diese Aktion.',
  'err.freeTierLimit': 'Kostenloses Limit erreicht (250). Upgrade auf Pro für unbegrenzte Einträge.',
  'err.seatLimit': 'Sitzplatzlimit erreicht (max. 5 Mitglieder).',
  'err.csvMissingColumn': 'CSV muss eine Spalte "faceit_name" enthalten.',
  'err.fileEmpty': 'Datei enthält keine Zeilen.',
  'err.jsonParseFailed': 'Datei konnte nicht gelesen werden — stelle sicher, dass es ein gültiges JSON ist.',
  'err.jsonFormat': 'JSON muss ein Array von Namen sein, oder ein Objekt mit einem "items"-Array.',
  'err.sessionExpired': 'Sitzung abgelaufen. Bitte erneut anmelden.',
  'err.alreadyBanned': 'Dieser Spieler ist bereits in deiner Banlist.',
  'err.networkFailed': 'Verbindungsfehler. Überprüfe deine Internetverbindung.',
  'err.fileTooLarge': 'Datei zu groß (max. 5 MB).',
  'err.tooManyRows': 'Datei enthält zu viele Zeilen (max. 5 000).',
  'err.inviteLimit': 'Einladungslimit erreicht (max. 10 aktive Links).',

  'paywall.title': 'Team-Bereich',
  'paywall.desc': 'Teile deine Banlist mit bis zu 5 Teamkollegen, verwalte Rollen und halte alle synchron.',
  'paywall.feature1': 'Geteilter Teambereich · bis zu 5 Plätze',
  'paywall.feature2': 'Mitgliedszuordnung für jeden Ban',
  'auth.signInDiscord': 'Mit Discord anmelden',
};

const translations: Record<Language, Dict> = {
  en,
  fr,
  'pt-BR': ptBR,
  ru,
  tr,
  es,
  de,
};

export function t(
  key: StringKey,
  lang: Language,
  vars?: Record<string, string | number>
): string {
  const dict = translations[lang] ?? translations[DEFAULT_LANGUAGE];
  let str = dict[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

export function detectLanguage(): Language {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  const code = nav.toLowerCase();
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('pt')) return 'pt-BR';
  if (code.startsWith('ru')) return 'ru';
  if (code.startsWith('tr')) return 'tr';
  if (code.startsWith('es')) return 'es';
  if (code.startsWith('de')) return 'de';
  return 'en';
}
