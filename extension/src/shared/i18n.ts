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
  | 'banlist.deleteTooltip'
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
  // Modal
  | 'modal.unbanTitle' | 'modal.unbanMessage'
  | 'modal.cancel' | 'modal.confirm'
  // Notifications
  | 'notif.added' | 'notif.removed' | 'notif.refreshed'
  | 'notif.settingsSaved' | 'notif.connected' | 'notif.exported'
  // Errors
  | 'err.allRequired' | 'err.noApiKey' | 'err.noAuthor' | 'err.emptyExport'
  | 'err.unreachable' | 'err.permDenied';

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
  'import.help': 'JSON — an array of names or full objects. CSV — first row must be a header. Author defaults to the value set in Settings.',

  'export.title': 'Export',
  'export.hint': 'Download the current banlist as a JSON or CSV file. The JSON format round-trips through Import; the CSV is convenient for spreadsheets.',
  'export.entries': '{n} entries',
  'export.note': 'The file lands in your usual download folder. Re-importing it later restores the same names — duplicates will be skipped.',

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

  'modal.unbanTitle': 'Unban {name}',
  'modal.unbanMessage': 'This player will no longer be highlighted on FACEIT pages.',
  'modal.cancel': 'Cancel',
  'modal.confirm': 'Confirm',

  'notif.added': 'Player added to banlist',
  'notif.removed': '{name} removed from banlist',
  'notif.refreshed': 'Banlist refreshed',
  'notif.settingsSaved': 'Settings saved',
  'notif.connected': 'Connected to {url}',
  'notif.exported': 'Exported {n} entries as {format}',

  'err.allRequired': 'All fields are required',
  'err.noApiKey': 'API key is not set. Open Settings to configure it.',
  'err.noAuthor': 'Set a default author in Settings first.',
  'err.emptyExport': 'Banlist is empty, nothing to export.',
  'err.unreachable': 'Could not reach the API at {url}.',
  'err.permDenied': 'Permission denied for this URL.',
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
  'export.hint': 'Télécharge la banlist actuelle en JSON ou CSV. Le format JSON est ré-importable; le CSV est pratique pour un tableur.',
  'export.entries': '{n} entrées',
  'export.note': 'Le fichier va dans ton dossier Téléchargements habituel. Le ré-importer plus tard restaure la liste — les doublons sont ignorés.',

  'settings.title': 'Paramètres',
  'settings.urlLabel': "URL du serveur API",
  'settings.urlHint': 'Exemples : http://localhost:8000, http://192.168.1.10:8000, https://api.example.com',
  'settings.keyLabel': 'Clé API',
  'settings.keyHint': 'Nécessaire pour ajouter ou retirer des bans. Stockée localement.',
  'settings.getKey': 'Obtenir une clé via Discord',
  'settings.authorLabel': 'Auteur par défaut',
  'settings.authorHint': 'Utilisé comme "auteur" quand tu cliques sur le bouton Ban sur une carte de joueur.',
  'settings.languageLabel': 'Langue',
  'settings.reset': 'Réinitialiser',
  'settings.test': 'Tester la connexion',
  'settings.save': 'Enregistrer',

  'modal.unbanTitle': 'Débannir {name}',
  'modal.unbanMessage': "Ce joueur ne sera plus mis en évidence sur les pages FACEIT.",
  'modal.cancel': 'Annuler',
  'modal.confirm': 'Confirmer',

  'notif.added': 'Joueur ajouté à la banlist',
  'notif.removed': '{name} retiré de la banlist',
  'notif.refreshed': 'Banlist rafraîchie',
  'notif.settingsSaved': 'Paramètres enregistrés',
  'notif.connected': 'Connecté à {url}',
  'notif.exported': '{n} entrées exportées en {format}',

  'err.allRequired': 'Tous les champs sont requis',
  'err.noApiKey': "La clé API n'est pas définie. Ouvre les Paramètres pour la configurer.",
  'err.noAuthor': "Définis d'abord un auteur par défaut dans les Paramètres.",
  'err.emptyExport': 'La banlist est vide, rien à exporter.',
  'err.unreachable': "Impossible d'atteindre l'API à {url}.",
  'err.permDenied': 'Permission refusée pour cette URL.',
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
  'export.hint': 'Baixe a banlist atual como JSON ou CSV. O formato JSON pode ser reimportado; o CSV é prático para planilhas.',
  'export.entries': '{n} entradas',
  'export.note': 'O arquivo vai para a pasta de downloads habitual. Reimportá-lo depois restaura a lista — duplicatas são ignoradas.',

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

  'modal.unbanTitle': 'Desbanir {name}',
  'modal.unbanMessage': 'Este jogador não será mais destacado nas páginas do FACEIT.',
  'modal.cancel': 'Cancelar',
  'modal.confirm': 'Confirmar',

  'notif.added': 'Jogador adicionado à banlist',
  'notif.removed': '{name} removido da banlist',
  'notif.refreshed': 'Banlist atualizada',
  'notif.settingsSaved': 'Configurações salvas',
  'notif.connected': 'Conectado a {url}',
  'notif.exported': '{n} entradas exportadas em {format}',

  'err.allRequired': 'Todos os campos são obrigatórios',
  'err.noApiKey': 'Chave API não definida. Abra as Configurações para configurá-la.',
  'err.noAuthor': 'Defina um autor padrão nas Configurações primeiro.',
  'err.emptyExport': 'A banlist está vazia, nada para exportar.',
  'err.unreachable': 'Não foi possível alcançar a API em {url}.',
  'err.permDenied': 'Permissão negada para esta URL.',
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
  'export.hint': 'Скачать текущий бан-лист в JSON или CSV. JSON можно реимпортировать; CSV удобен для таблиц.',
  'export.entries': 'записей: {n}',
  'export.note': 'Файл сохраняется в обычную папку загрузок. При реимпорте — дубликаты пропускаются.',

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

  'modal.unbanTitle': 'Разбанить {name}',
  'modal.unbanMessage': 'Этот игрок больше не будет выделяться на страницах FACEIT.',
  'modal.cancel': 'Отмена',
  'modal.confirm': 'Подтвердить',

  'notif.added': 'Игрок добавлен в бан-лист',
  'notif.removed': '{name} удалён из бан-листа',
  'notif.refreshed': 'Бан-лист обновлён',
  'notif.settingsSaved': 'Настройки сохранены',
  'notif.connected': 'Подключено к {url}',
  'notif.exported': 'Экспортировано записей: {n} ({format})',

  'err.allRequired': 'Все поля обязательны',
  'err.noApiKey': 'Ключ API не задан. Откройте Настройки для конфигурации.',
  'err.noAuthor': 'Сначала задайте автора по умолчанию в Настройках.',
  'err.emptyExport': 'Бан-лист пуст, экспортировать нечего.',
  'err.unreachable': 'Не удалось подключиться к API по адресу {url}.',
  'err.permDenied': 'Доступ к этому URL запрещён.',
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
  'export.hint': 'Mevcut banlist\'i JSON veya CSV olarak indir. JSON formatı tekrar içe aktarılabilir; CSV tablolar için uygundur.',
  'export.entries': '{n} girdi',
  'export.note': 'Dosya alışılmış indirmeler klasörüne iner. Tekrar içe aktarınca kopyalar atlanır.',

  'settings.title': 'Ayarlar',
  'settings.urlLabel': 'API sunucu URL\'si',
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

  'modal.unbanTitle': '{name} yasağını kaldır',
  'modal.unbanMessage': 'Bu oyuncu artık FACEIT sayfalarında vurgulanmayacak.',
  'modal.cancel': 'İptal',
  'modal.confirm': 'Onayla',

  'notif.added': 'Oyuncu banliste eklendi',
  'notif.removed': '{name} banlistten kaldırıldı',
  'notif.refreshed': 'Banlist yenilendi',
  'notif.settingsSaved': 'Ayarlar kaydedildi',
  'notif.connected': '{url} adresine bağlandı',
  'notif.exported': '{n} girdi {format} olarak dışa aktarıldı',

  'err.allRequired': 'Tüm alanlar zorunlu',
  'err.noApiKey': 'API anahtarı tanımlı değil. Ayarları açıp girin.',
  'err.noAuthor': 'Önce Ayarlar\'da varsayılan bir yazar tanımlayın.',
  'err.emptyExport': 'Banlist boş, dışa aktarılacak bir şey yok.',
  'err.unreachable': '{url} adresindeki API\'ye ulaşılamadı.',
  'err.permDenied': 'Bu URL için izin reddedildi.',
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
  'export.hint': 'Descarga la banlist actual como JSON o CSV. El JSON se puede reimportar; el CSV va bien para hojas de cálculo.',
  'export.entries': '{n} entradas',
  'export.note': 'El archivo va a tu carpeta de descargas habitual. Al reimportarlo, los duplicados se ignoran.',

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

  'modal.unbanTitle': 'Desbanear a {name}',
  'modal.unbanMessage': 'Este jugador ya no se resaltará en las páginas de FACEIT.',
  'modal.cancel': 'Cancelar',
  'modal.confirm': 'Confirmar',

  'notif.added': 'Jugador añadido a la banlist',
  'notif.removed': '{name} eliminado de la banlist',
  'notif.refreshed': 'Banlist refrescada',
  'notif.settingsSaved': 'Ajustes guardados',
  'notif.connected': 'Conectado a {url}',
  'notif.exported': '{n} entradas exportadas como {format}',

  'err.allRequired': 'Todos los campos son obligatorios',
  'err.noApiKey': 'No hay clave API. Abre los Ajustes para configurarla.',
  'err.noAuthor': 'Define primero un autor por defecto en Ajustes.',
  'err.emptyExport': 'La banlist está vacía, nada que exportar.',
  'err.unreachable': 'No se ha podido contactar la API en {url}.',
  'err.permDenied': 'Permiso denegado para esta URL.',
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
  'export.hint': 'Lade die aktuelle Banlist als JSON oder CSV herunter. Das JSON-Format kann re-importiert werden; CSV eignet sich für Tabellenkalkulationen.',
  'export.entries': '{n} Einträge',
  'export.note': 'Die Datei landet im üblichen Download-Ordner. Beim erneuten Import werden Duplikate übersprungen.',

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

  'modal.unbanTitle': '{name} entbannen',
  'modal.unbanMessage': 'Dieser Spieler wird auf FACEIT-Seiten nicht mehr hervorgehoben.',
  'modal.cancel': 'Abbrechen',
  'modal.confirm': 'Bestätigen',

  'notif.added': 'Spieler zur Banlist hinzugefügt',
  'notif.removed': '{name} aus der Banlist entfernt',
  'notif.refreshed': 'Banlist aktualisiert',
  'notif.settingsSaved': 'Einstellungen gespeichert',
  'notif.connected': 'Verbunden mit {url}',
  'notif.exported': '{n} Einträge als {format} exportiert',

  'err.allRequired': 'Alle Felder sind erforderlich',
  'err.noApiKey': 'API-Schlüssel nicht gesetzt. Öffne die Einstellungen.',
  'err.noAuthor': 'Setze zuerst einen Standard-Autor in den Einstellungen.',
  'err.emptyExport': 'Banlist ist leer, nichts zu exportieren.',
  'err.unreachable': 'API unter {url} nicht erreichbar.',
  'err.permDenied': 'Berechtigung für diese URL verweigert.',
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
