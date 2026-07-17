import "./styles.css";

const STORAGE_KEY = "training-log-pwa-state-v1";
const LANGUAGE_KEY = "training-log-pwa-language";
const DATA_VERSION = 6;
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) === "ru" ? "ru" : "et";

// The application predates i18n and its Russian copy is embedded in the render
// functions. Keeping this ordered phrase table in one place lets every screen,
// chart tooltip, validation message and PWA prompt use the same Estonian copy
// without changing the shape of saved workout data.
const estonianPhrases = [
  ["Силовой журнал", "Treeningpäevik"],
  ["локально на устройстве", "andmed ainult selles seadmes"],
  ["На главную", "Avalehele"],
  ["Ручной режим", "Käsitsi sisestamine"],
  ["Здесь появится динамика после первых подходов", "Areng kuvatakse pärast esimesi seeriaid"],
  ["Сегодня по этому упражнению ещё нет подходов.", "Täna pole selle harjutuse juures veel seeriaid."],
  ["Пока есть только одна тренировка. Тренд появится после следующей.", "Praegu on ainult üks treening. Trend ilmub pärast järgmist."],
  ["Пока есть только одна тренировка. Сравнение появится после следующей.", "Praegu on ainult üks treening. Võrdlus ilmub pärast järgmist."],
  ["Тренд предварительный: всего 2 тренировки. Линия показывает только изменение между двумя точками, а не устойчивую тенденцию.", "Trend on esialgne: treeninguid on ainult kaks. Joon näitab kahe punkti vahelist muutust, mitte püsivat suundumust."],
  ["Производительность — условный индекс сессии: растёт, когда дистанция больше и/или средний темп быстрее. Используется только для сравнения своих тренировок между собой.", "Sooritus on treeningu võrdlusindeks: see kasvab pikema distantsi ja/või kiirema keskmise tempo korral. Indeks on mõeldud ainult enda treeningute võrdlemiseks."],
  ["Условный индекс сессии: растёт, когда дистанция больше и/или средний темп быстрее. Используется только для сравнения своих тренировок между собой.", "Treeningu võrdlusindeks kasvab pikema distantsi ja/või kiirema keskmise tempo korral. Seda kasutatakse ainult enda treeningute võrdlemiseks."],
  ["Средний темп на 500 м. В гребле меньшее время означает более высокую скорость.", "Keskmine tempo 500 m kohta. Sõudmises tähendab lühem aeg suuremat kiirust."],
  ["Если бы ты держал этот же темп 3000 м, получилось бы примерно такое время.", "Kui hoiaksid sama tempot 3000 m, oleks tulemus ligikaudu selline."],
  ["Дистанция не окрашивается как хорошо или плохо: цели сессий могут отличаться.", "Distantsi ei hinnata heaks ega halvaks, sest treeningute eesmärgid võivad erineda."],
  ["Сохранение силы:", "Jõu säilimine:"],
  ["Показывает, насколько последний рабочий подход сохранил силу относительно лучшего подхода сессии.", "Näitab, kui hästi säilis viimases tööseerias jõud võrreldes treeningu parima seeriaga."],
  ["Недостаточно рабочих подходов для оценки сохранения силы.", "Jõu säilimise hindamiseks pole piisavalt tööseeriaid."],
  ["Меньше = ближе к отказу. Само по себе снижение не является ухудшением.", "Väiksem = suutlikkuse piirile lähemal. Vähenemine ei tähenda iseenesest halvenemist."],
  ["Рабочие подходы с запасом 0–3 RIR.", "Tööseeriad varuga 0–3 RIR."],
  ["Сумма вес × повторения без разминки.", "Raskuse ja korduste summa ilma soojendusseeriateta."],
  ["Настройка тренажёра сохраняется только в истории и не участвует в расчёте прогресса.", "Seadme seadistus talletatakse ainult ajalukku ega mõjuta arengu arvutust."],
  ["Настройка сохраняется как контекст. Она не считается сложностью и не влияет на прогресс.", "Seadistus salvestatakse lisateabena. Seda ei käsitleta raskusena ja see ei mõjuta arengut."],
  ["Здесь важны время, дистанция и ровная привычка разогрева, без оценки тяжести.", "Siin on olulised aeg, distants ja ühtlane soojendusharjumus, koormust eraldi hindamata."],
  ["3000 м - быстрый пресет для рабочего фит-теста, обычные тренировки можно писать с любой дистанцией.", "3000 m on fitness-testi kiirvalik; tavatreeningu võib salvestada mis tahes distantsiga."],
  ["Нормы из Android: муж. 18-29 13:30, 30-39 14:00, 40-49 14:30, 50+ 15:00; жен. 15:00.", "Androidi normid: mehed 18–29 13:30, 30–39 14:00, 40–49 14:30, 50+ 15:00; naised 15:00."],
  ["Экспорт сохраняет упражнения, подходы, картинки и настройки в один JSON-файл.", "Eksport salvestab harjutused, seeriad, pildid ja seaded ühte JSON-faili."],
  ["Кнопка установки появляется, когда браузер разрешает установку.", "Paigaldusnupp ilmub siis, kui brauser lubab rakenduse paigaldada."],
  ["Приложение проверяет новый service worker при запуске и раз в минуту.", "Rakendus kontrollib uut service worker'it käivitamisel ja kord minutis."],
  ["Последняя загруженная версия открывается без сети, данные остаются на устройстве.", "Viimati laaditud versioon töötab võrguühenduseta ja andmed jäävad seadmesse."],
  ["У упражнения есть история. Удалить упражнение и все его подходы?", "Harjutusel on ajalugu. Kas kustutada harjutus ja kõik selle seeriad?"],
  ["Заменить текущие локальные данные импортированным файлом?", "Kas asendada praegused kohalikud andmed imporditud faili andmetega?"],
  ["Service worker ещё не зарегистрирован.", "Service worker pole veel registreeritud."],
  ["Новая версия пока не найдена.", "Uut versiooni ei leitud."],
  ["Не удалось прочитать JSON-файл.", "JSON-faili lugemine ebaõnnestus."],
  ["Доступна новая версия", "Uus versioon on saadaval"],
  ["Миграции применяются автоматически", "Andmeuuendused rakenduvad automaatselt"],
  ["Дни с записанными подходами", "Salvestatud seeriatega päevad"],
  ["Все записи хранятся локально", "Kõik kirjed talletatakse kohalikult"],
  ["Примерно в памяти браузера", "Ligikaudne maht brauseri mälus"],
  ["Разминка не влияет на прогресс.", "Soojendus ei mõjuta arengut."],
  ["Рабочий подход влияет на прогресс.", "Tööseeria mõjutab arengut."],
  ["Не влияет на прогресс", "Ei mõjuta arengut"],
  ["Нужны хотя бы два рабочих подхода в тренировке.", "Treeningus peab olema vähemalt kaks tööseeriat."],
  ["Насколько проседает серия от первого рабочего подхода к последнему.", "Kui palju langeb tulemus esimesest tööseeriast viimaseni."],
  ["Сколько километров набрано за сессию.", "Treeningu jooksul läbitud kilomeetrid."],
  ["Сколько работы сделано за день.", "Päeva jooksul tehtud töö maht."],
  ["Средняя скорость по времени и дистанции.", "Keskmine kiirus aja ja distantsi põhjal."],
  ["Та же работа с большим запасом = прогресс.", "Sama töö suurema varuga tähendab arengut."],
  ["Есть первая кардио-точка. Следующая тренировка даст сравнение скорости, дистанции и времени.", "Esimene kardiotreening on kirjas. Järgmine treening võimaldab võrrelda kiirust, distantsi ja aega."],
  ["Есть первая точка. Следующая тренировка даст сравнение.", "Esimene tulemus on kirjas. Järgmine treening võimaldab võrrelda."],
  ["Недостаточно данных для тренда", "Trendi jaoks pole piisavalt andmeid"],
  ["нужна ещё одна тренировка для сравнения", "võrdlemiseks on vaja veel üht treeningut"],
  ["Нужна ещё одна тренировка", "Vaja on veel üht treeningut"],
  ["Нужна ещё одна точка", "Vaja on veel üht tulemust"],
  ["Недостаточно данных", "Pole piisavalt andmeid"],
  ["нет корректного сравнения", "sobiv võrdlus puudub"],
  ["без изменений к прошлой тренировке", "eelmise treeninguga võrreldes muutuseta"],
  ["без изменений к прошлому разу", "eelmise korraga võrreldes muutuseta"],
  ["к прошлой тренировке", "võrreldes eelmise treeninguga"],
  ["к прошлому разу", "võrreldes eelmise korraga"],
  ["первая тренировка", "esimene treening"],
  ["Первая точка", "Esimene tulemus"],
  ["Тренд предварительный", "Trend on esialgne"],
  ["Нет истории", "Ajalugu puudub"],
  ["нет истории", "ajalugu puudub"],
  ["История пока пустая.", "Ajalugu on praegu tühi."],
  ["В этом месяце тренировок нет.", "Sel kuul treeninguid pole."],
  ["Упражнение не найдено", "Harjutust ei leitud"],
  ["Удалённое упражнение", "Kustutatud harjutus"],
  ["Прошлых рабочих подходов пока нет.", "Varasemaid tööseeriaid veel pole."],
  ["Прошлых разминочных подходов пока нет.", "Varasemaid soojendusseeriaid veel pole."],
  ["Введите вес и повторы", "Sisesta raskus ja kordused"],
  ["Вес должен быть больше 0", "Raskus peab olema suurem kui 0"],
  ["Повторы должны быть больше 0", "Korduste arv peab olema suurem kui 0"],
  ["Запас должен быть 0 или больше", "Varu peab olema vähemalt 0"],
  ["Время должно быть больше 0", "Aeg peab olema suurem kui 0"],
  ["Дистанция должна быть больше 0", "Distants peab olema suurem kui 0"],
  ["Редактирование подхода", "Seeria muutmine"],
  ["Редактирование кардио", "Kardiokirje muutmine"],
  ["Редактировать упражнение", "Muuda harjutust"],
  ["Редактировать кардио", "Muuda kardiokirjet"],
  ["Редактировать подход", "Muuda seeriat"],
  ["Удалить упражнение", "Kustuta harjutus"],
  ["Удалить подход", "Kustuta seeria"],
  ["Удалить запись", "Kustuta kirje"],
  ["Удалить запись?", "Kas kustutada kirje?"],
  ["Упражнение обновлено", "Harjutus on uuendatud"],
  ["Упражнение добавлено", "Harjutus on lisatud"],
  ["Кардио изменено", "Kardiokirje on muudetud"],
  ["Кардио записано", "Kardiokirje on salvestatud"],
  ["Подход изменён", "Seeria on muudetud"],
  ["Разминка записана", "Soojendus on salvestatud"],
  ["Подход записан", "Seeria on salvestatud"],
  ["Запись удалена", "Kirje on kustutatud"],
  ["Своя картинка", "Oma pilt"],
  ["Выбрать файл", "Vali fail"],
  ["Вес вместе со штангой", "Raskus koos kangiga"],
  ["Запас повторов", "Korduste varu"],
  ["Настройка тренажёра", "Seadme seadistus"],
  ["Дистанция за сессию.", "Treeningu distants."],
  ["Расчётное время на 3000 м по текущему среднему темпу. Ниже = лучше.", "Arvestuslik 3000 m aeg praeguse keskmise tempo põhjal. Väiksem on parem."],
  ["Лучший e1RM за тренировку.", "Treeningu parim e1RM."],
  ["Рабочих подходов нет.", "Tööseeriaid pole."],
  ["Показать разминку", "Näita soojendust"],
  ["Скрыть разминку", "Peida soojendus"],
  ["Подставить разминку", "Kasuta soojenduse soovitust"],
  ["Подставить рабочий", "Kasuta tööseeria soovitust"],
  ["Повторить последний", "Korda viimast"],
  ["Лучший прошлый", "Eelmise korra parim"],
  ["Рабочий запас", "Tööseeria varu"],
  ["Разминка запас", "Soojenduse varu"],
  ["Короткий график прогресса", "Lühike arengugraafik"],
  ["Прогресс упражнения", "Harjutuse areng"],
  ["Выбор упражнения", "Harjutuse valik"],
  ["Последние тренировки", "Viimased treeningud"],
  ["Расчётный максимум", "Arvestuslik maksimum"],
  ["расч. максимум", "arvestuslik maksimum"],
  ["Макс. вес", "Suurim raskus"],
  ["Тяжёлые подходы", "Rasked seeriad"],
  ["Средний запас", "Keskmine varu"],
  ["Среди рабочих подходов.", "Tööseeriate hulgas."],
  ["Без разминки.", "Ilma soojenduseta."],
  ["Тоннаж", "Kogumaht"],
  ["Производительность", "Sooritus"],
  ["производительность", "sooritus"],
  ["Дистанция", "Distants"],
  ["дистанция", "distants"],
  ["Скорость", "Kiirus"],
  ["скорость", "kiirus"],
  ["Темп", "Tempo"],
  ["темп", "tempo"],
  ["Время", "Aeg"],
  ["времени", "aega"],
  ["Устойчивость", "Stabiilsus"],
  ["Пик силы", "Jõu tipp"],
  ["Объём", "Maht"],
  ["объём", "maht"],
  ["Серия", "Seeria"],
  ["падение", "langus"],
  ["Сила", "Jõud"],
  ["Запас", "Varu"],
  ["запас", "varu"],
  ["Вывод", "Kokkuvõte"],
  ["Больше = лучше.", "Suurem on parem."],
  ["Ниже = быстрее.", "Väiksem on kiirem."],
  ["ниже = быстрее", "väiksem on kiirem"],
  ["ниже лучше", "väiksem on parem"],
  ["меньше лучше", "väiksem on parem"],
  ["лучший", "parim"],
  ["История", "Ajalugu"],
  ["Прогресс", "Areng"],
  ["Упражнения", "Harjutused"],
  ["упражнений", "harjutust"],
  ["Упражнение", "Harjutus"],
  ["упражнение", "harjutus"],
  ["Подходы сегодня", "Tänased seeriad"],
  ["подходов", "seeriat"],
  ["Подходов", "Seeriaid"],
  ["подх.", "seeriat"],
  ["рабочих", "tööseeriat"],
  ["раб.", "tööseeriat"],
  ["тяж.", "rasket"],
  ["трен.", "treeningut"],
  ["зап.", "kirjet"],
  ["Сегодня", "Täna"],
  ["сегодня", "täna"],
  ["Всего сегодня", "Täna kokku"],
  ["Открыть день", "Ava päev"],
  ["Открыть", "Ava"],
  ["Свернуть", "Sulge"],
  ["Новое упражнение", "Uus harjutus"],
  ["Новое", "Uus"],
  ["Найти упражнение", "Otsi harjutust"],
  ["В работе", "Kasutatud"],
  ["Название", "Nimi"],
  ["Иконка", "Ikoon"],
  ["Группа", "Rühm"],
  ["Оборудование", "Varustus"],
  ["Сохранить изменения", "Salvesta muudatused"],
  ["Сохранить", "Salvesta"],
  ["Добавить", "Lisa"],
  ["Закрыть", "Sulge"],
  ["Назад", "Tagasi"],
  ["Править", "Muuda"],
  ["Динамика", "Muutus"],
  ["Повторы", "Kordused"],
  ["Разминка", "Soojendus"],
  ["Рабочий", "Tööseeria"],
  ["Раб.", "Töö"],
  ["Разм.", "Sooj."],
  ["Отмена", "Tühista"],
  ["Записать подход", "Salvesta seeria"],
  ["Записать кардио", "Salvesta kardio"],
  ["Записать упражнение", "Salvesta harjutus"],
  ["Минуты", "Minutid"],
  ["Секунды", "Sekundid"],
  ["мин разогрев", "min soojendus"],
  ["мин:сек работы", "tööaeg min:sek"],
  ["мин", "min"],
  ["сек", "s"],
  ["например", "näiteks"],
  ["Гребля", "Sõudmine"],
  ["Эллипс: спокойное кардио", "Elliptiline trenažöör: rahulik kardio"],
  ["Кардио", "Kardio"],
  ["кардио", "kardio"],
  ["Жим лёжа", "Lamades surumine"],
  ["Тяга горизонтального блока", "Istudes plokktõmme"],
  ["Жим гантелей сидя", "Istudes hantlite surumine"],
  ["Кроссовер", "Plokkidel lendamine"],
  ["Трицепс на блоке", "Triitsepsi allasurumine plokil"],
  ["Присед в смитте", "Kükk Smithi masinal"],
  ["Румынская тяга", "Rumeenia jõutõmme"],
  ["Выпады с гантелями", "Väljaasted hantlitega"],
  ["Тяга вертикального блока", "Ülalt plokktõmme"],
  ["Пресс", "Kõhulihased"],
  ["Тяга гантели в наклоне", "Hantlitõmme kummargil"],
  ["Разведения гантелей в стороны", "Hantlite tõsted külgedele"],
  ["Бицепс с гантелями", "Biitseps hantlitega"],
  ["Гребля", "Sõudmine"],
  ["Жим", "Surumine"],
  ["Тяга", "Tõmme"],
  ["Ноги", "Jalad"],
  ["Кор", "Keretüvi"],
  ["Другое", "Muu"],
  ["Штанга", "Kang"],
  ["Гантели", "Hantlid"],
  ["Тренажер", "Masin"],
  ["Блок", "Plokk"],
  ["Смит", "Smith"],
  ["Свой вес", "Keharaskus"],
  ["Установить", "Paigalda"],
  ["Обновить", "Uuenda"],
  ["Проверить обновления", "Kontrolli uuendusi"],
  ["Данные", "Andmed"],
  ["Версия данных", "Andmeversioon"],
  ["Дней", "Päevi"],
  ["Размер", "Maht"],
  ["Резервная копия", "Varukoopia"],
  ["Скачать JSON", "Laadi JSON alla"],
  ["Импорт JSON", "Impordi JSON"],
  ["Установка", "Paigaldamine"],
  ["Обновления", "Uuendused"],
  ["Оффлайн", "Võrguühenduseta"],
  ["Настр.", "Seaded"],
  ["Упр.", "Harj."],
  ["Клавиатура", "Klaviatuur"],
  ["Скрыть клавиатуру", "Peida klaviatuur"],
  ["Цифровой ввод", "Numbrisisestus"],
  ["0, отказ", "0, suutlikkuse piir"],
  ["0 отказ", "0 piir"],
  ["1 в запасе", "1 varuks"],
  ["в запасе", "varuks"],
  ["много запаса", "palju varu"],
  ["очень легко", "väga kerge"],
  ["очень тяжело", "väga raske"],
  ["тяжело", "raske"],
  ["средне", "keskmine"],
  ["легко", "kerge"],
  ["отказ", "suutlikkuse piir"],
  ["настройка не указана", "seadistus puudub"],
  ["настройка", "seadistus"],
  ["по темпу", "tempo põhjal"],
  ["за последнюю сессию", "viimase treeningu jooksul"],
  ["по текущему среднему темпу", "praeguse keskmise tempo põhjal"],
  ["с историей", "ajalooga"],
  ["Нет данных.", "Andmed puuduvad."],
  ["нет рабочих", "tööseeriaid pole"],
  ["КБ", "KB"],
  ["кг×повт", "kg×kord"],
  ["кг", "kg"],
  ["км/ч", "km/h"],
  ["км", "km"],
  [" м", " m"],
  ["Текущий язык: эстонский", "Praegune keel: eesti"],
  ["Текущий язык: русский", "Praegune keel: vene"],
  ["Найти упражнение", "Otsi harjutust"],
  ["темп последней", "viimase treeningu tempo"],
  ["Расч. максимум", "Arvestuslik maksimum"],
  ["Расч. максимум: последние 2 тренировки", "Arvestuslik maksimum: 2 viimast treeningut"],
  ["Индекс: последние 2 тренировки", "Indeks: 2 viimast treeningut"],
  ["Для сравнения нужны 2 тренировки", "Võrdlemiseks on vaja 2 treeningut"],
  ["Пока записана 1 тренировка", "Praegu on salvestatud 1 treening"],
  ["Истории пока нет", "Ajalugu veel puudub"],
  ["Сравнение появится после следующей тренировки", "Võrdlus ilmub pärast järgmist treeningut"],
  ["Сравнение появится после второй тренировки", "Võrdlus ilmub pärast teist treeningut"],
  ["разница", "erinevus"],
  ["3000 м тест", "3000 m test"],
  ["Заслонка 9", "Siibri asend 9"],
  ["В прошлой тренировке было только", "Eelmisel treeningul oli ainult"],
  ["разм. подх.", "soojendusseeriat."],
  ["раб. подх.", "tööseeriat."],
  ["Разминка №", "Soojendus nr "],
  ["Прошлая разминка №", "Eelmine soojendus nr "],
  ["Прошлый рабочий №", "Eelmine tööseeria nr "],
  ["новая и не влияет на прогресс.", "on uus ega mõjuta arengut."],
  ["новый, сравнение не строю.", "on uus, seega võrdlust ei kuvata."],
  ["e1RM не считается: reps+RIR > 15", "e1RM-i ei arvutata: reps+RIR > 15"],
  ["e1RM не считается: reps + RIR > 15", "e1RM-i ei arvutata: reps + RIR > 15"],
  ["e1RM не считается: reps+RIR &gt; 15", "e1RM-i ei arvutata: reps+RIR &gt; 15"],
  ["Запишите хотя бы один подход.", "Salvesta vähemalt üks seeria."],
  ["Подробнее", "Vaata lähemalt"],
  ["Тренд считается по истории упражнения.", "Trend arvutatakse harjutuse ajaloo põhjal."],
  ["Есть первая точка. Следующая тренировка даст сравнение силы, тяжёлых подходов, тоннажа и запаса.", "Esimene tulemus on kirjas. Järgmine treening võimaldab võrrelda jõudu, raskeid seeriaid, kogumahtu ja varu."],
  ["Сила выросла:", "Jõud kasvas:"],
  ["Расчётный максимум снизился на", "Arvestuslik maksimum vähenes"],
  ["Это может быть усталость, меньший запас или обычное колебание.", "Põhjuseks võib olla väsimus, väiksem varu või tavapärane kõikumine."],
  ["Расчётный максимум почти не изменился.", "Arvestuslik maksimum jäi peaaegu samaks."],
  ["Для корректного сравнения силы пока не хватает валидных подходов.", "Jõu korrektseks võrdlemiseks pole veel piisavalt sobivaid seeriaid."],
  ["Качественный объём вырос:", "Kvaliteetne maht kasvas:"],
  ["Тяжёлых подходов меньше:", "Raskeid seeriaid oli vähem:"],
  ["Тоннаж вырос на", "Kogumaht kasvas"],
  ["Тоннаж ниже на", "Kogumaht vähenes"],
  ["Средний запас снизился до", "Keskmine varu vähenes tasemele"],
  ["работа стала ближе к отказу.", "töö jõudis suutlikkuse piirile lähemale."],
  ["Средний запас вырос до", "Keskmine varu kasvas tasemele"],
  ["тренировка была дальше от отказа.", "treening jäi suutlikkuse piirist kaugemale."],
  ["Вывод предварительный: истории пока мало.", "Kokkuvõte on esialgne, sest ajalugu on veel vähe."],
  ["e1RM: ", "e1RM: "],
  ["тяжёлые:", "rasked seeriad:"],
  ["тоннаж:", "kogumaht:"],
  ["Рабочие подходы с запасом 0–3.", "Tööseeriad varuga 0–3."],
  ["Меньше = ближе к отказу.", "Väiksem tähendab suutlikkuse piirile lähemal."],
  ["Первая точка по гребле:", "Esimene sõudmistulemus:"],
  [" по этому темпу", " selle tempo põhjal"],
  [" за ", " ajaga "],
  ["средний темп", "keskmine tempo"],
  ["Сравнение появится после следующей тренировки.", "Võrdlus ilmub pärast järgmist treeningut."],
  ["Производительность почти не изменилась.", "Sooritus jäi peaaegu samaks."],
  ["Производительность выросла на", "Sooritus kasvas"],
  ["Производительность снизилась на", "Sooritus vähenes"],
  ["Темп улучшился на", "Tempo paranes"],
  ["Темп стал медленнее на", "Tempo aeglustus"],
  ["Темп почти не изменился.", "Tempo jäi peaaegu samaks."],
  ["Дистанция выросла на", "Distants suurenes"],
  ["Дистанция стала меньше на", "Distants vähenes"],
  ["Расчётные 3000 м быстрее на", "Arvestuslik 3000 m aeg paranes"],
  ["Расчётные 3000 м медленнее на", "Arvestuslik 3000 m aeg halvenes"],
  ["Тренд предварительный: всего 2 тренировки.", "Trend on esialgne: treeninguid on ainult kaks."],
  ["Условный индекс: больше = лучше. Учитывает дистанцию и среднюю скорость.", "Võrdlusindeks: suurem on parem. Arvestab distantsi ja keskmist kiirust."],
  ["лучший чистый 1ПМ", "parim puhas 1RM"],
  ["рабочие кг×повт", "töömaht kg×kord"],
  ["средний RIR 0-10", "keskmine RIR 0–10"],
  ["эквивалент по темпу", "tempo põhjal arvutatud tulemus"],
  ["падение меньше = лучше", "väiksem langus on parem"],
  ["расчётный максимум", "arvestuslik maksimum"],
  ["упр.", "harj."],
  ["пик", "tipp"],
  ["1ПМ", "1RM"],
  ["средняя", "keskmine"],
  ["рабочие подходы", "tööseeriad"],
  ["средняя скорость выше", "keskmine kiirus on suurem"],
  ["средняя скорость ниже", "keskmine kiirus on väiksem"],
  ["дистанция выше", "distants on pikem"],
  ["дистанция ниже", "distants on lühem"],
  ["времени больше", "aega kulus rohkem"],
  ["времени меньше", "aega kulus vähem"],
  ["производительность выросла", "sooritus paranes"],
  ["производительность снизилась", "sooritus halvenes"],
  ["объём выше", "maht on suurem"],
  ["объём ниже", "maht on väiksem"],
  ["запаса больше", "varu on suurem"],
  ["запаса меньше", "varu on väiksem"],
  ["Продолжить сегодня", "Jätka tänast treeningut"],
  ["Избранное", "Lemmikud"],
  ["Недавние", "Hiljutised"],
  ["Результаты поиска", "Otsingutulemused"],
  ["Все упражнения", "Kõik harjutused"],
  ["Добавить в избранное", "Lisa lemmikutesse"],
  ["Убрать из избранного", "Eemalda lemmikutest"],
  ["Сегодня также", "Täna veel"],
  ["Тип подхода", "Seeria tüüp"],
  ["Первый подход этого упражнения", "Selle harjutuse esimene seeria"],
  ["Повторить последний", "Korda viimast"],
  ["Другие варианты", "Muud variandid"],
  ["Скрыть варианты", "Peida variandid"],
  ["Лучший прошлый", "Eelmise treeningu parim"],
  ["Прошлая тренировка — нажмите, чтобы подставить", "Eelmine treening — puuduta väärtuste kasutamiseks"],
  ["Прошлой тренировки пока нет.", "Eelmist treeningut veel pole."],
  ["Скрыть 6–10", "Peida 6–10"],
  ["Что такое RIR?", "Mis on RIR?"],
  ["Сколько повторений можно было бы сделать дополнительно. 0 — отказ, 3 — осталось примерно три повтора.", "Mitu kordust oleksid suutnud veel teha. 0 — suutlikkuse piir, 3 — varuks jäi umbes kolm kordust."],
  ["Заметка", "Märkus"],
  ["необязательно", "valikuline"],
  ["Например: техника, самочувствие, высота сиденья", "Näiteks tehnika, enesetunne või istme kõrgus"],
  ["Например: самочувствие или настройка", "Näiteks enesetunne või seadistus"],
  ["Последнее действие отменено", "Viimane toiming võeti tagasi"],
  ["Отменить", "Võta tagasi"],
  ["Отдых закончен", "Puhkeaeg on läbi"],
  ["Отдых", "Puhkus"],
  ["Открыть календарь", "Ava kalender"],
  ["Скрыть календарь", "Peida kalender"],
  ["Быстрый доступ", "Kiirvaade"],
  ["Заметка к дню", "Päeva märkus"],
  ["Как прошла тренировка?", "Kuidas treening läks?"],
  ["Настройки", "Seaded"],
  ["Приложение", "Rakendus"],
  ["Язык", "Keel"],
  ["Текущий язык приложения", "Rakenduse praegune keel"],
  ["Таймер отдыха", "Puhkuse taimer"],
  ["Запускается после рабочего подхода", "Käivitub pärast tööseeriat"],
  ["Длительность отдыха", "Puhkuse kestus"],
  ["О приложении", "Rakendusest"],
  ["Хранилище, PWA и технические данные", "Salvestusruum, PWA ja tehnilised andmed"],
  ["С прошлого раза", "Võrreldes eelmise korraga"],
  ["Средний RIR", "Keskmine RIR"],
  ["Тяжёлые", "Rasked seeriad"],
  ["Что это значит?", "Mida see tähendab?"],
  ["Скрыть объяснение", "Peida selgitus"],
  ["Это первая тренировка упражнения. Сравнение появится после следующей.", "See on harjutuse esimene treening. Võrdlus ilmub pärast järgmist."],
  ["последние", "viimased"],
  ["Пн", "E"], ["Вт", "T"], ["Ср", "K"], ["Чт", "N"], ["Пт", "R"], ["Сб", "L"], ["Вс", "P"]
];
const sortedEstonianPhrases = estonianPhrases.slice().sort(([a], [b]) => b.length - a.length);

function localizeText(value) {
  if (currentLanguage !== "et" || value == null) return String(value ?? "");
  return sortedEstonianPhrases.reduce((text, [source, target]) => text.split(source).join(target), String(value));
}

function localizeUi(root) {
  if (currentLanguage !== "et") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) node.nodeValue = localizeText(node.nodeValue);
  root.querySelectorAll("[placeholder], [aria-label], [title]").forEach((element) => {
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      if (element.hasAttribute(attribute)) element.setAttribute(attribute, localizeText(element.getAttribute(attribute)));
    });
  });
}

function applyDocumentLanguage() {
  document.documentElement.lang = currentLanguage;
  document.title = currentLanguage === "et" ? "Treeningpäevik" : "Силовой журнал";
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = currentLanguage === "et"
    ? "Kohalik jõutreeningute päevik"
    : "Локальный журнал силовых упражнений";
}
const categories = [
  ["push", "Жим"],
  ["pull", "Тяга"],
  ["legs", "Ноги"],
  ["core", "Кор"],
  ["cardio", "Кардио"],
  ["other", "Другое"]
];
const equipment = [
  ["barbell", "Штанга"],
  ["dumbbell", "Гантели"],
  ["machine", "Тренажер"],
  ["cable", "Блок"],
  ["smith", "Смит"],
  ["bodyweight", "Свой вес"],
  ["cardio", "Кардио"],
  ["other", "Другое"]
];
const seedExercises = [
  ["Жим лёжа", "push", "barbell", "🏋️"],
  ["Тяга горизонтального блока", "pull", "cable", "↔️"],
  ["Жим гантелей сидя", "push", "dumbbell", "💪"],
  ["Кроссовер", "push", "cable", "✳️"],
  ["Трицепс на блоке", "push", "cable", "⬇️"],
  ["Присед в смитте", "legs", "smith", "🦵"],
  ["Румынская тяга", "legs", "dumbbell", "〽️"],
  ["Выпады с гантелями", "legs", "dumbbell", "🚶"],
  ["Тяга вертикального блока", "pull", "cable", "⬇️"],
  ["Пресс", "core", "bodyweight", "◼️"],
  ["Тяга гантели в наклоне", "pull", "dumbbell", "↙️"],
  ["Разведения гантелей в стороны", "pull", "dumbbell", "↔️"],
  ["Бицепс с гантелями", "pull", "dumbbell", "💪"],
  ["Face pull", "pull", "cable", "🎯"],
  ["Гребля", "cardio", "cardio", "🚣"]
];

let state = loadState();
let route = { name: "home" };
let draftSet = { weight: "", reps: "8", reserve: 2, warmup: false };
let draftCardio = { minutes: "", seconds: "", distanceM: "", setting: "" };
let exerciseFormOpen = false;
let chartRefs = [];
let activeSetField = "weight";
let keypadOpen = false;
let strengthDraftDirty = false;
let pendingSuggestionType = null;
let formError = "";
let nativeKeyboard = false;
let editingSetId = null;
let editingReturnRoute = null;
let editingExerciseId = null;
let lastTouchedSetId = null;
let waitingServiceWorker = null;
let serviceWorkerRegistration = null;
let historyCursor = new Date();
let activeHistoryDay = dayKey(Date.now());
let expandedHistoryExercises = new Set();
let expandedExerciseGroups = new Set(["active"]);
let exerciseSearchQuery = "";
let progressChartTab = "strength";
let cardioProgressTab = "performance";
let expandedProgressWarmups = new Set();
let chartTooltip = null;
let toast = null;
let toastTimer = null;
let strengthOptionsOpen = false;
let rirExpanded = false;
let rirHelpOpen = false;
let historyCalendarOpen = false;
let settingsTechnicalOpen = false;
let progressExplanationOpen = false;
let draftNote = "";
let undoRecord = null;
let restTimerEnd = null;
let restTimerTick = null;

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return migrateState(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  const now = Date.now();
  return migrateState({
    schemaVersion: DATA_VERSION,
    exercises: seedExercises.map(([name, category, equipmentType, icon], index) => ({
      id: uid(),
      name,
      category,
      equipmentType,
      icon,
      image: "",
      createdAt: now + index
    })),
    sets: [],
    dayNotes: {},
    settings: { unit: "кг", language: currentLanguage, favoriteExerciseIds: [], restTimerEnabled: false, restTimerSeconds: 90 }
  });
}

function migrateState(input) {
  const migrated = {
    schemaVersion: DATA_VERSION,
    exercises: [],
    sets: [],
    dayNotes: {},
    settings: { unit: "кг", autoUpdateCheck: true, language: currentLanguage, favoriteExerciseIds: [], restTimerEnabled: false, restTimerSeconds: 90 },
    ...input
  };
  migrated.settings = { unit: "кг", autoUpdateCheck: true, language: currentLanguage, favoriteExerciseIds: [], restTimerEnabled: false, restTimerSeconds: 90, ...(input.settings || {}) };
  migrated.settings.favoriteExerciseIds = Array.isArray(migrated.settings.favoriteExerciseIds) ? migrated.settings.favoriteExerciseIds : [];
  migrated.settings.restTimerSeconds = Math.max(15, Math.min(600, Number(migrated.settings.restTimerSeconds) || 90));
  migrated.dayNotes = input.dayNotes && typeof input.dayNotes === "object" ? input.dayNotes : {};
  if (!localStorage.getItem(LANGUAGE_KEY) && ["et", "ru"].includes(migrated.settings.language)) {
    currentLanguage = migrated.settings.language;
  }
  migrated.exercises = (input.exercises || []).map((exercise) => ({
    id: exercise.id || uid(),
    name: exercise.name === "Гребля 3000 м" ? "Гребля" : exercise.name || "Упражнение",
    category: exercise.category || "other",
    equipmentType: exercise.equipmentType || "other",
    icon: exercise.icon || "🏋️",
    image: exercise.image || "",
    createdAt: exercise.createdAt || Date.now()
  }));
  if (!migrated.exercises.some((exercise) => isRowingExercise(exercise))) {
    migrated.exercises.push({
      id: uid(),
      name: "Гребля",
      category: "cardio",
      equipmentType: "cardio",
      icon: "🚣",
      image: "",
      createdAt: Date.now()
    });
  }
  migrated.sets = (input.sets || [])
    .filter((set) => {
      const cardio = set.type === "cardio" || set.durationSec != null || set.distanceM != null || set.durationMin != null || set.distanceKm != null;
      const strength = Number.isFinite(Number(set.weight)) && Number.isFinite(Number(set.reps));
      return set.exerciseId && (cardio || strength);
    })
    .map((set) => {
      if (set.type === "cardio" || set.durationSec != null || set.distanceM != null || set.durationMin != null || set.distanceKm != null) {
        const durationSec = set.durationSec != null
          ? Number(set.durationSec)
          : (Number(set.durationMin) || 0) * 60;
        const distanceM = set.distanceM != null
          ? Number(set.distanceM)
          : (Number(set.distanceKm) || 0) * 1000;
        const next = {
          id: set.id || uid(),
          type: "cardio",
          exerciseId: set.exerciseId,
          durationSec: Math.max(0, Math.round(Number.isFinite(durationSec) ? durationSec : 0)),
          distanceM: Math.max(0, Math.round(Number.isFinite(distanceM) ? distanceM : 0)),
          setting: set.setting != null ? String(set.setting) : "",
          note: set.note != null ? String(set.note) : "",
          createdAt: set.createdAt || Date.now()
        };
        if (set.updatedAt) next.updatedAt = set.updatedAt;
        return next;
      }
      const reserve = set.reserve != null ? Number(set.reserve) : reserveValue(set);
      const next = {
        id: set.id || uid(),
        type: "strength",
        exerciseId: set.exerciseId,
        weight: Number(set.weight),
        reps: Number(set.reps),
        reserve: Math.max(0, Math.min(10, Number.isFinite(reserve) ? reserve : 0)),
        warmup: Boolean(set.warmup),
        note: set.note != null ? String(set.note) : "",
        createdAt: set.createdAt || Date.now()
      };
      if (set.updatedAt) next.updatedAt = set.updatedAt;
      return next;
    });
  return migrated;
}

function saveState() {
  state.settings.language = currentLanguage;
  localStorage.setItem(LANGUAGE_KEY, currentLanguage);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setRoute(next) {
  route = next;
  if (next.name === "home") expandedExerciseGroups = new Set();
  if (next.name !== "exercise") {
    editingSetId = null;
    editingReturnRoute = null;
    keypadOpen = false;
    formError = "";
    strengthOptionsOpen = false;
    rirHelpOpen = false;
    draftNote = "";
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

function label(list, key) {
  return list.find(([value]) => value === key)?.[1] || "Другое";
}

function formatWeight(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(".", ",");
}

function formatDateTime(ts) {
  return new Intl.DateTimeFormat(currentLanguage === "et" ? "et-EE" : "ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(ts));
}

function formatDate(ts) {
  return new Intl.DateTimeFormat(currentLanguage === "et" ? "et-EE" : "ru-RU", { day: "2-digit", month: "2-digit" }).format(new Date(ts));
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(date) {
  return new Intl.DateTimeFormat(currentLanguage === "et" ? "et-EE" : "ru-RU", { month: "long", year: "numeric" }).format(date);
}

function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function e1rm(set) {
  return set.weight * (1 + set.reps / 30);
}

function estimatedE1rm(set) {
  return set.weight * (1 + (set.reps + reserveValue(set)) / 30);
}

function validE1rmSet(set) {
  return (
    set?.type === "strength" &&
    !set.warmup &&
    Number(set.weight) > 0 &&
    Number(set.reps) > 0 &&
    reserveValue(set) >= 0 &&
    set.reps + reserveValue(set) <= 15
  );
}

function isCardioExercise(exercise) {
  return exercise?.category === "cardio" || exercise?.equipmentType === "cardio";
}

function isCardioSet(set) {
  return set?.type === "cardio" || set?.durationSec != null || set?.distanceM != null || set?.durationMin != null || set?.distanceKm != null;
}

function isRowingExercise(exercise) {
  return /греб|гребл|row/i.test(exercise?.name || "");
}

function isEllipticalExercise(exercise) {
  return /эллип|ellipt/i.test(exercise?.name || "");
}

function reserveValue(set) {
  if (set.reserve != null) return set.reserve;
  if (set.effort == null) return 0;
  return Math.max(0, Math.min(10, 10 - set.effort));
}

function reserveName(value) {
  if (value <= 0) return "0, отказ";
  if (value <= 1) return "1 в запасе";
  if (value <= 3) return `${value} в запасе`;
  if (value <= 6) return "много запаса";
  return "очень легко";
}

function reserveColor(value) {
  const hue = 6 + Math.max(0, Math.min(10, value)) * 13;
  return `hsl(${hue} 63% 42%)`;
}

function adjustedScore(set) {
  if (isCardioSet(set)) return cardioScore(set);
  const base = e1rm(set);
  const reserveBonus = 1 + Math.min(6, Math.max(0, reserveValue(set))) * 0.012;
  const warmupPenalty = set.warmup ? 0.72 : 1;
  return base * reserveBonus * warmupPenalty;
}

function cardioDurationSec(set) {
  if (set?.durationSec != null) return Number(set.durationSec) || 0;
  return (Number(set?.durationMin) || 0) * 60;
}

function cardioDistanceM(set) {
  if (set?.distanceM != null) return Number(set.distanceM) || 0;
  return (Number(set?.distanceKm) || 0) * 1000;
}

function cardioDistanceKm(set) {
  return cardioDistanceM(set) / 1000;
}

function cardioSpeed(set) {
  const durationSec = cardioDurationSec(set);
  const distanceKm = cardioDistanceKm(set);
  return durationSec > 0 ? distanceKm / durationSec * 3600 : 0;
}

function cardioPace(set) {
  const distanceKm = cardioDistanceKm(set);
  const durationSec = cardioDurationSec(set);
  return distanceKm > 0 ? durationSec / distanceKm : null;
}

function cardioScore(set) {
  const distance = cardioDistanceKm(set);
  const durationSec = cardioDurationSec(set);
  const speed = cardioSpeed(set);
  return distance > 0 ? distance * 100 + speed * 6 : durationSec / 60 * 4;
}

function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return "—";
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${minutes}:${String(sec).padStart(2, "0")}`;
}

function formatDistanceMeters(value) {
  const meters = Math.max(0, Math.round(Number(value) || 0));
  return meters >= 1000 && meters % 1000 === 0 ? `${meters / 1000} км` : `${meters} м`;
}

function formatDistanceKm(value) {
  return `${formatWeight(Number(value) || 0)} км`;
}

function formatPace(secondsPerKm) {
  if (secondsPerKm == null || !Number.isFinite(secondsPerKm)) return "—";
  const safe = Math.max(0, Math.round(secondsPerKm));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} /км`;
}

function rowingSplit500(setOrSession) {
  const durationSec = cardioDurationSec(setOrSession);
  const distanceM = cardioDistanceM(setOrSession);
  return durationSec > 0 && distanceM > 0 ? durationSec * 500 / distanceM : null;
}

function row3000Equivalent(setOrSession) {
  const durationSec = cardioDurationSec(setOrSession);
  const distanceM = cardioDistanceM(setOrSession);
  return durationSec > 0 && distanceM > 0 ? durationSec * 3000 / distanceM : null;
}

function performanceDeltaText(last, previous) {
  if (!last) return "Недостаточно данных";
  if (!previous) return "нужна ещё одна тренировка для сравнения";
  const delta = last.performanceScore - previous.performanceScore;
  if (Math.abs(delta) < 0.05) return "без изменений к прошлому разу";
  return `${delta > 0 ? "+" : "−"}${formatWeight(Math.abs(delta))} к прошлому разу`;
}

function deltaClass(delta, lowerIsBetter = false) {
  if (delta == null || Math.abs(delta) < 0.05) return "";
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  return improved ? "good" : "bad";
}

function rowing3000Label(setOrSession) {
  const distanceM = cardioDistanceM(setOrSession);
  const equivalent = row3000Equivalent(setOrSession);
  if (equivalent == null) return "3000 м: —";
  const exact = Math.abs(distanceM - 3000) < 1;
  return `${exact ? "3000 м" : "3000 м по темпу"}: ${formatDuration(equivalent)}`;
}

function rowNormsText() {
  return "Нормы из Android: муж. 18-29 13:30, 30-39 14:00, 40-49 14:30, 50+ 15:00; жен. 15:00.";
}

function setsForExercise(exerciseId) {
  return state.sets
    .filter((set) => set.exerciseId === exerciseId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function groupSetsByWorkout(sets) {
  const groups = new Map();
  sets.forEach((set) => {
    const key = `${dayKey(set.createdAt)}-${set.exerciseId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(set);
  });
  return [...groups.values()].map((items) => items.sort((a, b) => a.createdAt - b.createdAt));
}

function sessionMetrics(items) {
  if (items.some(isCardioSet)) {
    const cardio = items.filter(isCardioSet);
    const durationSec = cardio.reduce((sum, set) => sum + cardioDurationSec(set), 0);
    const distanceM = cardio.reduce((sum, set) => sum + cardioDistanceM(set), 0);
    const distanceKm = distanceM / 1000;
    const speedKmh = durationSec > 0 ? distanceKm / durationSec * 3600 : 0;
    const pace = distanceKm > 0 ? durationSec / distanceKm : null;
    const score = distanceKm > 0 ? distanceKm * 100 + speedKmh * 6 : durationSec / 60 * 4;
    const pace500Sec = distanceM > 0 ? durationSec / distanceM * 500 : null;
    const projected3000Sec = pace500Sec != null ? pace500Sec * 6 : null;
    const settings = [...new Set(cardio.map((set) => String(set.setting || "").trim()).filter(Boolean))];
    return {
      type: "cardio",
      date: items[0]?.createdAt || Date.now(),
      count: cardio.length,
      workCount: cardio.length,
      warmupCount: 0,
      durationSec,
      durationMin: durationSec / 60,
      distanceM,
      distanceKm,
      speedKmh,
      pace,
      score,
      performanceScore: score,
      pace500Sec,
      projected3000Sec,
      settings,
      tonnage: 0,
      pureE1rm: 0,
      avgReserve: 0,
      fatigue: null,
      top: cardio.reduce((best, set) => (cardioScore(set) > cardioScore(best || set) ? set : best), cardio[0])
    };
  }
  const work = items.filter((set) => !set.warmup);
  const validWork = work.filter(validE1rmSet);
  const excludedE1rm = work.filter((set) => !validE1rmSet(set));
  const top = validWork.length
    ? validWork.reduce((best, set) => (estimatedE1rm(set) > estimatedE1rm(best || set) ? set : best), validWork[0])
    : null;
  const tonnage = work.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const maxWorkingWeight = work.length ? Math.max(...work.map((set) => Number(set.weight) || 0)) : 0;
  const bestSessionE1RM = top ? estimatedE1rm(top) : 0;
  const pureE1rm = bestSessionE1RM;
  const score = bestSessionE1RM;
  const avgReserve = work.reduce((sum, set) => sum + reserveValue(set), 0) / Math.max(1, work.length);
  const hardSets = work.filter((set) => reserveValue(set) <= 3).length;
  const lastValid = validWork.at(-1) || null;
  const strengthRetention = validWork.length >= 2 && bestSessionE1RM > 0
    ? estimatedE1rm(lastValid) / bestSessionE1RM * 100
    : null;
  const fatigue = strengthRetention == null ? null : 100 - strengthRetention;
  const start = items.at(0)?.createdAt || Date.now();
  const end = items.at(-1)?.createdAt || start;
  const minutes = Math.max(1, (end - start) / 60000);
  const density = tonnage / minutes;
  const firstWork = work.at(0) || null;
  const lastWork = work.at(-1) || null;
  return {
    date: start,
    count: items.length,
    workCount: work.length,
    warmupCount: items.length - work.length,
    top,
    tonnage,
    pureE1rm,
    bestSessionE1RM,
    maxWorkingWeight,
    hardSets,
    score,
    avgReserve,
    fatigue,
    strengthRetention,
    validWorkCount: validWork.length,
    excludedE1rmCount: excludedE1rm.length,
    workingSets: work,
    warmupSets: items.filter((set) => set.warmup),
    excludedE1rm,
    density,
    firstWork,
    lastWork
  };
}

function progressForExercise(exerciseId) {
  return groupSetsByWorkout(setsForExercise(exerciseId))
    .map(sessionMetrics)
    .filter((session) => session.type === "cardio" || session.workCount > 0);
}

function latestExerciseStats(exerciseId) {
  const sessions = progressForExercise(exerciseId);
  const last = sessions.at(-1);
  const prev = sessions.at(-2);
  const best = sessions.reduce((acc, item) => (item.score > (acc?.score || 0) ? item : acc), null);
  return { sessions, last, prev, best };
}

function trackedExercises() {
  return state.exercises
    .map((exercise) => ({ exercise, sessions: progressForExercise(exercise.id), sets: setsForExercise(exercise.id) }))
    .filter((item) => item.sets.length > 0)
    .sort((a, b) => (b.sessions.at(-1)?.date || 0) - (a.sessions.at(-1)?.date || 0));
}

function setsByDay() {
  const grouped = new Map();
  state.sets
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((set) => {
      const key = dayKey(set.createdAt);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(set);
    });
  return grouped;
}

function daySummary(items) {
  const work = items.filter((set) => !isCardioSet(set) && !set.warmup);
  const cardio = items.filter(isCardioSet);
  const exerciseIds = new Set(items.map((set) => set.exerciseId));
  const tonnage = work.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const distanceM = cardio.reduce((sum, set) => sum + cardioDistanceM(set), 0);
  const durationSec = cardio.reduce((sum, set) => sum + cardioDurationSec(set), 0);
  const top = work.reduce((best, set) => (adjustedScore(set) > adjustedScore(best || set) ? set : best), work[0] || null);
  return {
    exerciseCount: exerciseIds.size,
    setCount: items.length,
    workCount: work.length,
    cardioCount: cardio.length,
    distanceM,
    distanceKm: distanceM / 1000,
    durationSec,
    durationMin: durationSec / 60,
    tonnage,
    top
  };
}

function exerciseGroupsForDay(items) {
  const groups = new Map();
  items.forEach((set) => {
    if (!groups.has(set.exerciseId)) groups.set(set.exerciseId, []);
    groups.get(set.exerciseId).push(set);
  });
  return [...groups.entries()].map(([exerciseId, sets]) => ({
    exerciseId,
    exercise: state.exercises.find((item) => item.id === exerciseId),
    sets: sets.sort((a, b) => a.createdAt - b.createdAt),
    metrics: sessionMetrics(sets)
  }));
}

function previousWorkoutSets(exerciseId, beforeTs = Date.now()) {
  return groupSetsByWorkout(setsForExercise(exerciseId).filter((set) => set.createdAt < beforeTs))
    .filter((items) => dayKey(items[0].createdAt) !== dayKey(Date.now()))
    .at(-1) || [];
}

function todayStrengthIndex(exerciseId, warmup) {
  return state.sets.filter((set) => set.exerciseId === exerciseId && !isCardioSet(set) && Boolean(set.warmup) === warmup && dayKey(set.createdAt) === dayKey(Date.now())).length;
}

function previousStrengthSets(exerciseId, warmup) {
  return previousWorkoutSets(exerciseId)
    .filter((set) => !isCardioSet(set) && Boolean(set.warmup) === warmup)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function previousStrengthTarget(exerciseId, warmup, index = todayStrengthIndex(exerciseId, warmup)) {
  const previous = previousStrengthSets(exerciseId, warmup);
  return previous[index] || null;
}

function todayStrengthSets(exerciseId, warmup = null) {
  return state.sets
    .filter((set) => (
      set.exerciseId === exerciseId &&
      !isCardioSet(set) &&
      dayKey(set.createdAt) === dayKey(Date.now()) &&
      (warmup == null || Boolean(set.warmup) === warmup)
    ))
    .sort((a, b) => a.createdAt - b.createdAt);
}

function defaultStrengthType(exerciseId) {
  const todayWarmups = todayStrengthSets(exerciseId, true);
  const todayWork = todayStrengthSets(exerciseId, false);
  if (!todayWarmups.length && !todayWork.length) return true;
  if (todayWarmups.length && !todayWork.length) return true;
  return false;
}

function suggestedDraftSet(exerciseId, fallback = {}) {
  const warmup = fallback.warmup ?? defaultStrengthType(exerciseId);
  const todaySameType = todayStrengthSets(exerciseId, warmup);
  const previousSession = previousWorkoutSets(exerciseId);
  const previousSameType = previousSession
    .filter((set) => !isCardioSet(set) && Boolean(set.warmup) === warmup)
    .sort((a, b) => a.createdAt - b.createdAt);
  const previousAny = previousSession
    .filter((set) => !isCardioSet(set))
    .sort((a, b) => a.createdAt - b.createdAt);
  const target = previousSameType[todaySameType.length] ||
    todaySameType.at(-1) ||
    previousSameType[0] ||
    previousAny.at(-1) ||
    null;
  return {
    weight: target ? String(target.weight) : fallback.weight || "",
    reps: target ? String(target.reps) : fallback.reps || "8",
    reserve: target ? reserveValue(target) : fallback.reserve ?? (warmup ? 6 : 2),
    warmup
  };
}

function currentDraftScore() {
  const weight = Number(String(draftSet.weight || 0).replace(",", "."));
  const reps = Number(draftSet.reps || 0);
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(reps) || reps <= 0) return null;
  return adjustedScore({
    weight,
    reps,
    reserve: Number(draftSet.reserve || 0),
    warmup: Boolean(draftSet.warmup)
  });
}

function trendText(last, prev, suffix = "") {
  if (!last || !prev) return "Нужна ещё одна тренировка";
  const delta = last - prev;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatWeight(delta)}${suffix} к прошлому разу`;
}

function iconHtml(exercise) {
  if (exercise.image) return `<img src="${exercise.image}" alt="" />`;
  return `<span>${exercise.icon || "🏋️"}</span>`;
}

function haptic(pattern = 18) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function notify(text, tone = "") {
  toast = { text, tone };
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast = null;
    render();
  }, 1800);
}

function restTimerSecondsLeft() {
  return restTimerEnd ? Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000)) : 0;
}

function renderRestTimer() {
  const remaining = restTimerSecondsLeft();
  return `<div class="rest-timer"><span>Отдых</span><strong class="rest-timer-value">${formatDuration(remaining)}</strong><button type="button" data-action="stop-timer">×</button></div>`;
}

function startRestTimer() {
  if (!state.settings.restTimerEnabled) return;
  window.clearInterval(restTimerTick);
  restTimerEnd = Date.now() + Number(state.settings.restTimerSeconds || 90) * 1000;
  restTimerTick = window.setInterval(() => {
    const remaining = restTimerSecondsLeft();
    const output = document.querySelector(".rest-timer-value");
    if (output) output.textContent = formatDuration(remaining);
    if (remaining <= 0) {
      window.clearInterval(restTimerTick);
      restTimerTick = null;
      restTimerEnd = null;
      haptic([80, 40, 80]);
      notify("Отдых закончен", "success");
      render();
    }
  }, 500);
}

function stopRestTimer() {
  window.clearInterval(restTimerTick);
  restTimerTick = null;
  restTimerEnd = null;
  render();
}

function render() {
  chartRefs = [];
  const app = document.querySelector("#app");
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="На главную">
          <span class="brand-mark">${currentLanguage === "et" ? "T" : "Ж"}</span>
          <span><strong>Силовой журнал</strong><small>локально на устройстве</small></span>
        </button>
        <div class="topbar-actions">
          <button class="language-switch" data-action="language" aria-label="Текущий язык: ${currentLanguage === "et" ? "эстонский" : "русский"}">${currentLanguage.toUpperCase()}</button>
          <button class="install-button" data-action="install" hidden>Установить</button>
        </div>
      </header>
      <main>${renderRoute()}</main>
      ${editingExerciseId ? renderExerciseEditor() : ""}
      ${toast ? `<div class="toast ${toast.tone || ""}">${toast.text}</div>` : ""}
      ${undoRecord ? `<div class="undo-bar"><span>${undoRecord.message}</span><button type="button" data-action="undo-last">Отменить</button></div>` : ""}
      ${restTimerEnd ? renderRestTimer() : ""}
      <nav class="bottom-nav ${route.name === "exercise" || exerciseFormOpen || editingExerciseId ? "context-hidden" : ""} ${route.name === "exercise" && keypadOpen ? "keypad-active" : ""}">
        <button class="${route.name === "home" ? "active" : ""}" data-action="home">Упр.</button>
        <button class="${route.name === "progress" ? "active" : ""}" data-action="progress">Прогресс</button>
        <button class="${route.name === "history" ? "active" : ""}" data-action="history">История</button>
        <button class="${route.name === "settings" ? "active" : ""}" data-action="settings">Настр.</button>
      </nav>
    </div>
  `;
  applyDocumentLanguage();
  localizeUi(app);
  bindEvents(app);
  drawCharts();
}

function renderRoute() {
  if (route.name === "exercise") return renderExercise(route.id);
  if (route.name === "progress") return renderProgress(route.id);
  if (route.name === "history") return renderHistory();
  if (route.name === "settings") return renderSettings();
  return renderHome();
}

function renderHome() {
  const totalSets = state.sets.length;
  const trainedToday = state.sets.filter((set) => dayKey(set.createdAt) === dayKey(Date.now())).length;
  const todayItems = setsByDay().get(dayKey(Date.now())) || [];
  const todaySummary = daySummary(todayItems);
  const query = exerciseSearchQuery.trim().toLowerCase();
  const matchesQuery = (exercise) => {
    const searchable = `${exercise.name} ${label(equipment, exercise.equipmentType)} ${label(categories, exercise.category)}`;
    return !query || `${searchable} ${localizeText(searchable)}`.toLowerCase().includes(query);
  };
  const favoriteIds = new Set(state.settings.favoriteExerciseIds || []);
  const lastUsedAt = (exerciseId) => setsForExercise(exerciseId).at(-1)?.createdAt || 0;
  const usedExercises = state.exercises
    .filter((exercise) => lastUsedAt(exercise.id) > 0)
    .sort((a, b) => lastUsedAt(b.id) - lastUsedAt(a.id));
  const favoriteExercises = state.exercises.filter((exercise) => favoriteIds.has(exercise.id) && matchesQuery(exercise));
  const recentExercises = usedExercises.filter((exercise) => !favoriteIds.has(exercise.id) && matchesQuery(exercise)).slice(0, 6);
  const todayExerciseIds = [...new Set(todayItems.slice().sort((a, b) => b.createdAt - a.createdAt).map((set) => set.exerciseId))];
  const todayExercises = todayExerciseIds.map((id) => state.exercises.find((exercise) => exercise.id === id)).filter(Boolean);
  const grouped = categories.map(([key, title]) => [
    key,
    title,
    state.exercises.filter((item) => item.category === key && matchesQuery(item))
  ]);
  return `
    <section class="hero home-hero">
      <div>
        <p class="eyebrow">Ручной режим</p>
        <h1>Упражнения</h1>
      </div>
      <div class="hero-stats">
        <div><strong>${state.exercises.length}</strong><span>упражнений</span></div>
        <div><strong>${totalSets}</strong><span>подходов</span></div>
        <div><strong>${trainedToday}</strong><span>сегодня</span></div>
      </div>
    </section>
    ${todayItems.length && !query ? `
      <section class="panel compact-day continue-today">
        <div class="section-head">
          <div><span class="eyebrow compact-eyebrow">Сегодня</span><h2>Продолжить сегодня</h2></div>
          <button data-action="history-day" data-day="${dayKey(Date.now())}">Открыть день</button>
        </div>
        <div class="mini-metrics">
          <span>${todaySummary.exerciseCount} упр.</span>
          <span>${todaySummary.workCount} рабочих</span>
          <span>${formatWeight(todaySummary.tonnage)} кг×повт</span>
          ${todaySummary.cardioCount ? `<span>${formatDistanceKm(todaySummary.distanceKm)} кардио</span>` : ""}
        </div>
        <div class="today-exercise-strip">
          ${todayExercises.map((exercise) => `<button data-open-exercise="${exercise.id}">${exercise.icon || "🏋️"}<span>${exercise.name}</span><small>${todayItems.filter((set) => set.exerciseId === exercise.id).length}</small></button>`).join("")}
        </div>
      </section>
    ` : ""}
    <section class="toolbar">
      <input type="search" id="search" placeholder="Найти упражнение" autocomplete="off" value="${exerciseSearchQuery}" />
      <button class="primary" data-action="toggle-form">Новое</button>
    </section>
    ${exerciseFormOpen ? renderNewExerciseEditor() : ""}
    <section class="exercise-groups">
      ${favoriteExercises.length && !query ? `
        <div class="group featured-group">
          <div class="section-head home-section-head"><h2>Избранное</h2><span>${favoriteExercises.length}</span></div>
          <div class="exercise-list">${favoriteExercises.map(renderExerciseCard).join("")}</div>
        </div>
      ` : ""}
      ${recentExercises.length && !query ? `
        <div class="group recent-group">
          <div class="section-head home-section-head"><h2>Недавние</h2><span>последние ${recentExercises.length}</span></div>
          <div class="exercise-list">${recentExercises.map(renderExerciseCard).join("")}</div>
        </div>
      ` : ""}
      <div class="catalog-head"><h2>${query ? "Результаты поиска" : "Все упражнения"}</h2>${query ? "" : `<span>${state.exercises.length}</span>`}</div>
      ${grouped
        .filter(([, , items]) => items.length)
        .map(([key, title, items]) => `
          <div class="group ${key === "cardio" ? "cardio-group" : ""} ${query || expandedExerciseGroups.has(key) ? "expanded" : "collapsed"}">
            <button class="group-title" data-action="toggle-exercise-group" data-group="${key}">
              <h2>${title}</h2>
              <span>${items.length}</span>
            </button>
            <div class="exercise-list">
              ${items.map(renderExerciseCard).join("")}
            </div>
          </div>
        `)
        .join("")}
    </section>
  `;
}

function renderExerciseCard(exercise) {
  const { last, prev, sessions } = latestExerciseStats(exercise.id);
  const setCount = setsForExercise(exercise.id).length;
  const cardio = isCardioExercise(exercise);
  const rowing = isRowingExercise(exercise);
  const strengthDelta = !cardio && last && prev && last.bestSessionE1RM && prev.bestSessionE1RM
    ? last.bestSessionE1RM - prev.bestSessionE1RM
    : null;
  const cardioDelta = cardio && last && prev ? last.score - prev.score : null;
  const delta = cardio ? cardioDelta : strengthDelta;
  const deltaTone = delta == null || Math.abs(delta) < 0.05 ? "" : delta > 0 ? "good" : "bad";
  const mainValue = !last
    ? "Нет истории"
    : cardio
      ? rowing && last.pace500Sec ? `${formatDuration(last.pace500Sec)} /500 м` : formatWeight(last.performanceScore || last.score)
      : last.bestSessionE1RM ? `${formatWeight(last.bestSessionE1RM)} кг` : "—";
  const mainLabel = !last
    ? `${label(equipment, exercise.equipmentType)} · нет истории`
    : cardio
      ? rowing ? "темп последней" : "производительность"
      : "расч. максимум";
  const deltaText = !last
    ? ""
    : delta == null
      ? `${sessions.length} трен. · ${setCount} подх.`
      : cardio
        ? trendText(last.score, prev.score)
        : e1rmDeltaText(last, prev);
  const favorite = (state.settings.favoriteExerciseIds || []).includes(exercise.id);
  return `
    <article class="exercise-card ${last ? "has-history" : "empty-history"}" data-open-exercise="${exercise.id}">
      <div class="exercise-icon">${iconHtml(exercise)}</div>
      <div class="exercise-main">
        <h3>${exercise.name}</h3>
        <p>${mainLabel}</p>
      </div>
      <div class="exercise-score ${deltaTone}">
        <strong>${mainValue}</strong>
        <span>${deltaText}</span>
      </div>
      <button class="favorite-button ${favorite ? "active" : ""}" data-action="toggle-favorite" data-id="${exercise.id}" aria-label="${favorite ? "Убрать из избранного" : "Добавить в избранное"}" aria-pressed="${favorite}">${favorite ? "★" : "☆"}</button>
    </article>
  `;
}

function renderExerciseForm(exercise = null) {
  return `
    <form class="panel exercise-form" data-form="exercise" ${exercise ? `data-id="${exercise.id}"` : ""}>
      <h2>${exercise ? "Редактировать упражнение" : "Новое упражнение"}</h2>
      <div class="form-grid">
        <label>Название<input name="name" required value="${exercise?.name || ""}" /></label>
        <label>Иконка<input name="icon" maxlength="4" value="${exercise?.icon || "🏋️"}" /></label>
        <label>Группа<select name="category">${categories.map(([k, v]) => `<option value="${k}" ${exercise?.category === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>Оборудование<select name="equipmentType">${equipment.map(([k, v]) => `<option value="${k}" ${exercise?.equipmentType === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="wide">Своя картинка<span class="file-picker"><span class="file-picker-text">Выбрать файл</span><input type="file" name="image" accept="image/*" data-image-input /></span></label>
      </div>
      <div class="actions">
        <button class="primary" type="submit">${exercise ? "Сохранить" : "Добавить"}</button>
        <button type="button" data-action="toggle-form">Закрыть</button>
      </div>
    </form>
  `;
}

function renderNewExerciseEditor() {
  return `<div class="modal-backdrop" data-action="toggle-form"><div class="modal-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()">${renderExerciseForm()}</div></div>`;
}

function renderExerciseEditor() {
  const exercise = state.exercises.find((item) => item.id === editingExerciseId);
  if (!exercise) return "";
  return `
    <div class="modal-backdrop" data-action="close-exercise-editor">
      <div class="modal-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        ${renderExerciseForm(exercise)}
        <button class="danger-zone" data-action="delete-exercise" data-id="${exercise.id}">Удалить упражнение</button>
      </div>
    </div>
  `;
}

function renderExercise(exerciseId) {
  const exercise = state.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return `<section class="panel"><h1>Упражнение не найдено</h1></section>`;
  const isCardio = isCardioExercise(exercise);
  const allSets = setsForExercise(exerciseId);
  const todaySets = allSets.filter((set) => dayKey(set.createdAt) === dayKey(Date.now()));
  const sessions = progressForExercise(exerciseId);
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const editingSet = state.sets.find((set) => set.id === editingSetId && set.exerciseId === exerciseId);
  const todayWorkSets = todaySets.filter((set) => !isCardioSet(set) && !set.warmup);
  const e1rmDelta = !isCardio && last && previous && last.bestSessionE1RM && previous.bestSessionE1RM
    ? last.bestSessionE1RM - previous.bestSessionE1RM
    : null;
  const cardioDelta = isCardio && last && previous ? last.score - previous.score : null;
  const hasRecentComparison = isCardio ? cardioDelta != null : e1rmDelta != null;
  const recentComparison = hasRecentComparison
    ? {
        label: isCardio ? "Индекс: последние 2 тренировки" : "Расч. максимум: последние 2 тренировки",
        value: isCardio
          ? `${formatDate(previous.date)} ${formatWeight(previous.score)} → ${formatDate(last.date)} ${formatWeight(last.score)} (${cardioDelta >= 0 ? "+" : "−"}${formatWeight(Math.abs(cardioDelta))})`
          : `${formatDate(previous.date)} ${formatWeight(previous.bestSessionE1RM)} кг → ${formatDate(last.date)} ${formatWeight(last.bestSessionE1RM)} кг (${e1rmDelta >= 0 ? "+" : "−"}${formatWeight(Math.abs(e1rmDelta))} кг)`,
        delta: isCardio ? cardioDelta : e1rmDelta
      }
    : last
      ? {
          label: "Пока записана 1 тренировка",
          value: `${formatDate(last.date)} ${isCardio ? formatWeight(last.score) : `${formatWeight(last.bestSessionE1RM)} кг`} · Сравнение появится после следующей тренировки`,
          delta: null
        }
      : { label: "Истории пока нет", value: "Сравнение появится после второй тренировки", delta: null };
  const formValues = editingSet
    ? {
        weight: String(editingSet.weight),
        reps: String(editingSet.reps),
        reserve: reserveValue(editingSet),
        warmup: editingSet.warmup,
        note: editingSet.note || ""
      }
    : { ...draftSet, note: draftNote };
  return `
    <section class="exercise-header">
      <button data-action="home" class="ghost">← Назад</button>
      <div class="exercise-title">
        <div class="exercise-icon large">${iconHtml(exercise)}</div>
        <div><h1>${exercise.name}</h1><p>${label(categories, exercise.category)} · ${label(equipment, exercise.equipmentType)}</p></div>
      </div>
      <button data-action="edit-exercise" data-id="${exercise.id}">Править</button>
    </section>
    <section class="metrics-row">
      <div><span>Сегодня</span><strong>${isCardio ? todaySets.length : todayWorkSets.length ? `${todayWorkSets.length} раб.` : "0"}</strong></div>
      <div><span>${isCardio ? "Всего сегодня" : "Расч. максимум"}</span><strong>${isCardio ? formatDuration(todaySets.reduce((sum, set) => sum + cardioDurationSec(set), 0)) : last?.bestSessionE1RM ? `${formatWeight(last.bestSessionE1RM)} кг` : "—"}</strong></div>
      <div class="${recentComparison.delta == null ? "" : recentComparison.delta >= 0 ? "good" : "bad"}"><span>${recentComparison.label}</span><strong>${recentComparison.value}</strong></div>
    </section>
    ${renderTodayExerciseSwitcher(exerciseId)}
    ${isCardio ? renderCardioEntry(exercise, editingSet) : renderStrengthEntry(exercise, editingSet, formValues, allSets, previous)}
    <section class="panel">
      <div class="section-head"><h2>Подходы сегодня</h2><span>${formatDate(Date.now())}</span></div>
      ${todaySets.length ? `<div class="sets-list today-sets">${todaySets.map((set, index) => isCardioSet(set) ? renderSetRow(set) : renderTodayStrengthSetRow(set, index)).join("")}</div>` : `<p class="muted">Сегодня по этому упражнению ещё нет подходов.</p>`}
    </section>
    ${renderCompactProgressCard(exercise)}
  `;
}

function renderTodayExerciseSwitcher(currentExerciseId) {
  const today = state.sets.filter((set) => dayKey(set.createdAt) === dayKey(Date.now()));
  const ids = [...new Set(today.map((set) => set.exerciseId))].filter((id) => id !== currentExerciseId);
  if (!ids.length) return "";
  return `<section class="today-switcher"><span>Сегодня также</span><div>${ids.map((id) => {
    const exercise = state.exercises.find((item) => item.id === id);
    return exercise ? `<button data-open-exercise="${id}">${exercise.icon || "🏋️"} ${exercise.name}<small>${today.filter((set) => set.exerciseId === id).length}</small></button>` : "";
  }).join("")}</div></section>`;
}

function renderStrengthEntry(exercise, editingSet, formValues, allSets, previous) {
  const invalid = validateStrengthDraft(formValues);
  const currentReserve = Number(formValues.reserve);
  const visibleRirValues = rirExpanded
    ? Array.from({ length: 11 }, (_, value) => value)
    : [...new Set([0, 1, 2, 3, 4, 5, ...(currentReserve > 5 ? [currentReserve] : [])])];
  return `
    <form class="set-entry ${editingSet ? "editing" : ""}" data-form="set" data-id="${exercise.id}" data-kind="strength">
      ${editingSet ? `<div class="edit-banner"><strong>Редактирование подхода</strong><button type="button" data-action="cancel-edit">Отмена</button></div>` : ""}
      ${renderStrengthQuickChips(exercise.id, allSets, previous)}
      <div class="set-type-switch" role="group" aria-label="Тип подхода">
        <button type="button" data-action="set-type" data-warmup="false" class="${formValues.warmup ? "" : "active"}" aria-pressed="${!formValues.warmup}">Рабочий</button>
        <button type="button" data-action="set-type" data-warmup="true" class="${formValues.warmup ? "active" : ""}" aria-pressed="${formValues.warmup}">Разминка</button>
        <input type="checkbox" name="warmup" ${formValues.warmup ? "checked" : ""} hidden />
      </div>
      <div class="input-pair">
        <label class="number-control"><span>Вес вместе со штангой</span><div><button type="button" data-step-field="weight" data-delta="-2.5">−</button><input inputmode="${nativeKeyboard ? "decimal" : "none"}" name="weight" min="1" required value="${formValues.weight}" placeholder="80" ${nativeKeyboard ? "" : "readonly"} data-set-field="weight" class="${activeSetField === "weight" ? "active" : ""}" /><button type="button" data-step-field="weight" data-delta="2.5">+</button></div></label>
        <label class="number-control"><span>Повторы</span><div><button type="button" data-step-field="reps" data-delta="-1">−</button><input inputmode="${nativeKeyboard ? "numeric" : "none"}" name="reps" min="1" required value="${formValues.reps}" placeholder="8" ${nativeKeyboard ? "" : "readonly"} data-set-field="reps" class="${activeSetField === "reps" ? "active" : ""}" /><button type="button" data-step-field="reps" data-delta="1">+</button></div></label>
      </div>
      ${keypadOpen ? renderKeypad() : ""}
      <label class="effort-label"><span><button class="inline-help" type="button" data-action="toggle-rir-help">RIR <small>?</small></button><strong id="reserveText">${formValues.reserve} · ${reserveName(formValues.reserve)}</strong></span><input class="effort-slider" type="range" name="reserve" min="0" max="10" value="${formValues.reserve}" /></label>
      ${rirHelpOpen ? `<div class="context-help"><strong>Что такое RIR?</strong><span>Сколько повторений можно было бы сделать дополнительно. 0 — отказ, 3 — осталось примерно три повтора.</span></div>` : ""}
      <div class="rir-chips">
        ${visibleRirValues.map((value) => `<button type="button" data-action="set-reserve-only" data-reserve="${value}" aria-pressed="${Number(formValues.reserve) === value}" class="${Number(formValues.reserve) === value ? "active" : ""}">${value === 0 ? "0 отказ" : value}</button>`).join("")}
        ${rirExpanded ? `<button type="button" data-action="toggle-rir-values">Скрыть 6–10</button>` : `<button type="button" data-action="toggle-rir-values">6–10</button>`}
      </div>
      <p class="muted warmup-note">${formValues.warmup ? "Разминка не влияет на прогресс." : "Рабочий подход влияет на прогресс."}</p>
      ${renderSetComparison(exercise.id, formValues)}
      <label class="set-note">Заметка <span>необязательно</span><textarea name="note" rows="2" placeholder="Например: техника, самочувствие, высота сиденья">${formValues.note || ""}</textarea></label>
      ${formError || invalid ? `<p class="form-error">${formError || invalid}</p>` : ""}
      <button class="primary save-set" type="submit" ${invalid ? "disabled" : ""}>${editingSet ? "Сохранить изменения" : "Записать подход"}</button>
    </form>
  `;
}

function renderCardioEntry(exercise, editingSet) {
  const values = editingSet && isCardioSet(editingSet)
    ? {
        minutes: String(Math.floor(cardioDurationSec(editingSet) / 60) || ""),
        seconds: String(cardioDurationSec(editingSet) % 60 || ""),
        distanceM: String(Math.round(cardioDistanceM(editingSet)) || ""),
        setting: String(editingSet.setting || ""),
        note: String(editingSet.note || "")
      }
    : { ...draftCardio, note: draftNote };
  const rowing = isRowingExercise(exercise);
  const elliptical = isEllipticalExercise(exercise);
  return `
    <form class="set-entry ${editingSet ? "editing" : ""}" data-form="set" data-id="${exercise.id}" data-kind="cardio">
      ${editingSet ? `<div class="edit-banner"><strong>Редактирование кардио</strong><button type="button" data-action="cancel-edit">Отмена</button></div>` : ""}
      <div class="quick-row">
        ${rowing ? `<button type="button" data-action="cardio-distance" data-distance="3000">3000 м тест</button><button type="button" data-action="cardio-setting" data-setting="9">Заслонка 9</button>` : ""}
        ${elliptical ? `<button type="button" data-action="cardio-duration" data-minutes="8" data-seconds="0">8 мин разогрев</button>` : ""}
        <button type="button" data-action="cardio-duration" data-minutes="10" data-seconds="0">10 мин</button>
        <button type="button" data-action="cardio-duration" data-minutes="20" data-seconds="0">20 мин</button>
      </div>
      <div class="input-pair cardio-pair">
        <label class="number-control"><span>Минуты</span><input inputmode="numeric" name="minutes" min="0" required value="${values.minutes}" placeholder="13" /></label>
        <label class="number-control"><span>Секунды</span><input inputmode="numeric" name="seconds" min="0" max="59" value="${values.seconds}" placeholder="30" /></label>
      </div>
      <div class="input-pair cardio-pair">
        <label class="number-control"><span>Дистанция, м</span><input inputmode="numeric" name="distanceM" min="1" required value="${values.distanceM}" placeholder="${rowing ? "3000" : "1500"}" /></label>
        <label class="number-control cardio-setting"><span>Настройка тренажёра</span><input inputmode="decimal" name="setting" value="${values.setting || ""}" placeholder="например 9" /></label>
      </div>
      <div class="cardio-context">
        ${rowing ? `<strong>Гребля</strong><span>3000 м - быстрый пресет для рабочего фит-теста, обычные тренировки можно писать с любой дистанцией.</span><span>${rowNormsText()}</span><span>Настройка тренажёра сохраняется только в истории и не участвует в расчёте прогресса.</span>` : ""}
        ${elliptical ? `<strong>Эллипс: спокойное кардио</strong><span>Здесь важны время, дистанция и ровная привычка разогрева, без оценки тяжести.</span>` : ""}
        ${!rowing && !elliptical ? `<span>Настройка сохраняется как контекст. Она не считается сложностью и не влияет на прогресс.</span>` : ""}
      </div>
      <label class="set-note">Заметка <span>необязательно</span><textarea name="note" rows="2" placeholder="Например: самочувствие или настройка">${values.note || ""}</textarea></label>
      ${formError ? `<p class="form-error">${formError}</p>` : ""}
      <button class="primary save-set" type="submit">${editingSet ? "Сохранить изменения" : "Записать кардио"}</button>
    </form>
  `;
}

function renderSetComparison(exerciseId, formValues) {
  const warmup = Boolean(formValues.warmup);
  const index = todayStrengthIndex(exerciseId, warmup);
  const previous = previousStrengthSets(exerciseId, warmup);
  const target = previous[index] || null;
  if (formValues.warmup) {
    if (!target) {
      return previous.length
        ? `<div class="comparison muted">В прошлой тренировке было только ${previous.length} разм. подх. Разминка №${index + 1} новая и не влияет на прогресс.</div>`
        : `<div class="comparison muted">Прошлых разминочных подходов пока нет. Разминка не влияет на прогресс.</div>`;
    }
    return `
      <div class="comparison muted">
        <span>Прошлая разминка №${index + 1}: ${formatWeight(target.weight)} кг × ${target.reps}, ${reserveName(reserveValue(target))}</span>
        <strong>Не влияет на прогресс</strong>
      </div>
    `;
  }
  if (!target) {
    return previous.length
      ? `<div class="comparison muted">В прошлой тренировке было только ${previous.length} раб. подх. Рабочий №${index + 1} новый, сравнение не строю.</div>`
      : `<div class="comparison muted">Прошлых рабочих подходов пока нет.</div>`;
  }
  const weight = Number(String(formValues.weight || 0).replace(",", "."));
  const reps = Number(formValues.reps || 0);
  const canCompare = Number.isFinite(weight) && weight > 0 && Number.isFinite(reps) && reps > 0;
  const current = canCompare ? adjustedScore({ weight, reps, reserve: Number(formValues.reserve || 0), warmup: false }) : null;
  const previousScore = adjustedScore(target);
  const delta = current == null ? null : current - previousScore;
  const direction = delta == null ? "" : delta >= 0 ? "good" : "bad";
  return `
    <div class="comparison ${direction}">
      <span>Прошлый рабочий №${index + 1}: ${formatWeight(target.weight)} кг × ${target.reps}, ${reserveName(reserveValue(target))}</span>
      <strong>${delta == null ? "Введите вес и повторы" : trendText(current, previousScore)}</strong>
    </div>
  `;
}

function strengthFormValues(form) {
  return {
    weight: form.elements.weight?.value || "",
    reps: form.elements.reps?.value || "",
    reserve: Number(form.elements.reserve?.value || 0),
    warmup: Boolean(form.elements.warmup?.checked)
  };
}

function rememberStrengthForm(form) {
  const values = strengthFormValues(form);
  draftSet = { weight: values.weight, reps: values.reps, reserve: values.reserve, warmup: values.warmup };
  draftNote = form.elements.note?.value || "";
}

function updateStrengthComparison(root) {
  const form = root.querySelector("[data-form='set'][data-kind='strength']");
  const comparison = form?.querySelector(".comparison");
  if (!form || !comparison) return;
  comparison.outerHTML = renderSetComparison(form.dataset.id, strengthFormValues(form));
  localizeUi(form);
}

function syncReserveUi(root, reserve) {
  const value = Number(reserve);
  const form = root.querySelector("[data-form='set'][data-kind='strength']");
  if (!form) return;
  if (form.elements.reserve) form.elements.reserve.value = value;
  root.querySelectorAll(".rir-chips [data-reserve]").forEach((button) => {
    const active = Number(button.dataset.reserve) === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const reserveText = root.querySelector("#reserveText");
  if (reserveText) reserveText.textContent = localizeText(reserveName(value));
}

function finishSetEditing() {
  const returnRoute = editingReturnRoute;
  editingSetId = null;
  editingReturnRoute = null;
  if (returnRoute?.name === "history") {
    activeHistoryDay = returnRoute.activeHistoryDay || activeHistoryDay;
    historyCursor = returnRoute.historyCursor ? new Date(returnRoute.historyCursor) : historyCursor;
    route = { name: "history" };
    return;
  }
}

function applySuggestedStrengthValues(root) {
  const form = root.querySelector("[data-form='set'][data-kind='strength']");
  if (!form) return;
  const warmup = Boolean(form.elements.warmup?.checked);
  const currentReserve = Number(form.elements.reserve?.value || 0);
  const reserve = warmup
    ? Math.max(6, currentReserve || 6)
    : currentReserve >= 6 ? 2 : currentReserve || 2;
  const suggestion = suggestedDraftSet(form.dataset.id, {
    weight: form.elements.weight?.value || "",
    reps: form.elements.reps?.value || "8",
    reserve,
    warmup
  });
  form.elements.weight.value = suggestion.weight;
  form.elements.reps.value = suggestion.reps;
  form.elements.reserve.value = suggestion.reserve;
  if (!editingSetId) {
    draftSet = { ...draftSet, ...suggestion };
  }
  strengthDraftDirty = false;
  pendingSuggestionType = null;
  syncReserveUi(root, suggestion.reserve);
  updateStrengthComparison(root);
}

function renderSetRow(set) {
  if (isCardioSet(set)) {
    const pace = cardioPace(set);
    const exercise = state.exercises.find((item) => item.id === set.exerciseId);
    const rowing = isRowingExercise(exercise);
    return `
      <div class="set-row cardio-row ${set.id === lastTouchedSetId ? "just-saved" : ""}" data-action="edit-set" data-id="${set.id}">
        <strong>${formatDuration(cardioDurationSec(set))} · ${formatDistanceMeters(cardioDistanceM(set))}</strong>
        <span>${rowing ? `Темп /500 м ${formatDuration(rowingSplit500(set))} · ${rowing3000Label(set)}` : `${formatWeight(cardioSpeed(set))} км/ч · ${formatPace(pace)}`}${set.setting ? ` · настройка ${set.setting}` : ""} · ${formatDateTime(set.createdAt)}${set.note ? ` · ${set.note}` : ""}</span>
        <div class="set-actions">
          <button data-action="edit-set" data-id="${set.id}" aria-label="Редактировать кардио">✎</button>
          <button data-action="delete-set" data-id="${set.id}" aria-label="Удалить запись">×</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="set-row ${set.id === lastTouchedSetId ? "just-saved" : ""}" data-action="edit-set" data-id="${set.id}">
      <strong>${formatWeight(set.weight)} кг × ${set.reps}</strong>
      <span>${set.warmup ? "Разминка" : "Рабочий"} · ${reserveName(reserveValue(set))}${!set.warmup && !validE1rmSet(set) ? " · e1RM не считается: reps+RIR > 15" : ""} · ${formatDateTime(set.createdAt)}${set.note ? ` · ${set.note}` : ""}</span>
      <div class="set-actions">
        <button data-action="edit-set" data-id="${set.id}" aria-label="Редактировать подход">✎</button>
        <button data-action="delete-set" data-id="${set.id}" aria-label="Удалить подход">×</button>
      </div>
    </div>
  `;
}

function validateStrengthDraft(values) {
  const weight = Number(String(values.weight || "").replace(",", "."));
  const reps = Number(values.reps || 0);
  const reserve = Number(values.reserve);
  if (!Number.isFinite(weight) || weight <= 0) return "Вес должен быть больше 0";
  if (!Number.isInteger(reps) || reps <= 0) return "Повторы должны быть больше 0";
  if (!Number.isFinite(reserve) || reserve < 0) return "Запас должен быть 0 или больше";
  return "";
}

function rirIntensity(value) {
  const rir = reserveValue({ reserve: value });
  if (rir <= 1) return "очень тяжело";
  if (rir <= 3) return "тяжело";
  if (rir <= 5) return "средне";
  return "легко";
}

function renderTodayStrengthSetRow(set, index) {
  const valid = validE1rmSet(set);
  const score = valid ? estimatedE1rm(set) : null;
  return `
    <div class="set-row strength-today ${set.id === lastTouchedSetId ? "just-saved" : ""}" data-action="use-set" data-id="${set.id}">
      <strong>${index + 1}. ${set.warmup ? "Разм." : "Раб."} ${formatWeight(set.weight)} × ${set.reps} · <span class="rir-badge">RIR ${reserveValue(set)}</span></strong>
      <span>${rirIntensity(reserveValue(set))}${set.warmup ? "" : valid ? ` · e1RM ${formatWeight(score)}` : " · e1RM не считается: reps + RIR > 15"} · ${formatDateTime(set.createdAt)}${set.note ? ` · ${set.note}` : ""}</span>
      <div class="set-actions">
        <button data-action="edit-set" data-id="${set.id}" aria-label="Редактировать подход">✎</button>
        <button data-action="delete-set" data-id="${set.id}" aria-label="Удалить подход">×</button>
      </div>
    </div>
  `;
}

function renderStrengthQuickChips(exerciseId, allSets, previous) {
  const last = allSets.filter((set) => !isCardioSet(set)).at(-1);
  const previousSets = previousWorkoutSets(exerciseId).filter((set) => !isCardioSet(set));
  return `
    <div class="quick-actions">
      ${last ? `<button class="primary-suggestion" type="button" data-action="apply-set-chip" data-weight="${last.weight}" data-reps="${last.reps}" data-reserve="${reserveValue(last)}" data-warmup="${Boolean(last.warmup)}">Повторить последний <strong>${formatWeight(last.weight)} × ${last.reps} · RIR ${reserveValue(last)}</strong></button>` : `<span class="muted">Первый подход этого упражнения</span>`}
      <button type="button" data-action="toggle-strength-options">${strengthOptionsOpen ? "Скрыть варианты" : "Другие варианты"}</button>
    </div>
    ${strengthOptionsOpen ? `
      <div class="strength-options">
        ${previous?.top && !isCardioSet(previous.top) ? `<button type="button" data-action="apply-set-chip" data-weight="${previous.top.weight}" data-reps="${previous.top.reps}" data-reserve="${reserveValue(previous.top)}" data-warmup="false">Лучший прошлый <strong>${formatWeight(previous.top.weight)} × ${previous.top.reps} · RIR ${reserveValue(previous.top)}</strong></button>` : ""}
        ${previousSets.length ? `<div class="previous-set-options"><span>Прошлая тренировка — нажмите, чтобы подставить</span>${previousSets.map((set, index) => `<button type="button" data-action="apply-set-chip" data-weight="${set.weight}" data-reps="${set.reps}" data-reserve="${reserveValue(set)}" data-warmup="${Boolean(set.warmup)}"><small>${index + 1}</small>${formatWeight(set.weight)} × ${set.reps}<span>RIR ${reserveValue(set)}${set.warmup ? " · разминка" : ""}</span></button>`).join("")}</div>` : `<p class="muted">Прошлой тренировки пока нет.</p>`}
      </div>
    ` : ""}
  `;
}

function renderKeypad() {
  const decimalDisabled = activeSetField === "reps" ? "disabled" : "";
  return `
    <div class="keypad" aria-label="Цифровой ввод">
      ${["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => `<button type="button" data-key="${key}">${key}</button>`).join("")}
      <button type="button" data-key="clear">C</button>
      <button type="button" data-key="0">0</button>
      <button type="button" data-key="dot" ${decimalDisabled}>,</button>
      <button type="button" data-key="back" class="wide-key">⌫</button>
      <button type="button" data-action="toggle-keyboard" class="wide-key ${nativeKeyboard ? "active" : ""}">${nativeKeyboard ? "Скрыть клавиатуру" : "Клавиатура"}</button>
    </div>
  `;
}

function renderMiniProgress(exerciseId) {
  const sessions = progressForExercise(exerciseId);
  if (sessions.length < 1) return `<p class="muted">Запишите хотя бы один подход.</p>`;
  const cardio = sessions.some((s) => s.type === "cardio");
  const id = `chart-${chartRefs.length}`;
  chartRefs.push({
    id,
    values: sessions.map((s) => s.score),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "line",
    pointValues: cardio ? null : sessions.map((s) => s.avgReserve),
    details: sessions.map((s) => cardio
      ? `${formatDate(s.date)} · ${formatWeight(s.score)} производительность · ${formatDistanceKm(s.distanceKm)}`
      : `${formatDate(s.date)} · e1RM ${s.bestSessionE1RM ? formatWeight(s.bestSessionE1RM) : "—"} кг · ${formatWeight(s.avgReserve)} RIR`)
  });
  return `<canvas class="chart" id="${id}" height="190"></canvas>`;
}

function renderSparkline(values) {
  const clean = values.filter((value) => Number.isFinite(Number(value))).slice(-6);
  if (clean.length < 2) return `<div class="sparkline empty"></div>`;
  const width = 180;
  const height = 42;
  const max = Math.max(...clean);
  const min = Math.min(...clean);
  const range = max - min || 1;
  const points = clean.map((value, index) => {
    const x = clean.length === 1 ? width / 2 : (index / (clean.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return { x, y };
  });
  const polyline = points.map(({ x, y }) => `${formatWeight(x).replace(",", ".")},${formatWeight(y).replace(",", ".")}`).join(" ");
  return `
    <svg class="sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Короткий график прогресса">
      <polyline points="${polyline}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      ${points.map(({ x, y }, index) => `<circle cx="${formatWeight(x).replace(",", ".")}" cy="${formatWeight(y).replace(",", ".")}" r="${index === points.length - 1 ? "4.8" : "3.6"}" />`).join("")}
    </svg>
  `;
}

function renderCompactProgressCard(exercise) {
  const sessions = progressForExercise(exercise.id);
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const cardio = isCardioExercise(exercise);
  const values = cardio ? sessions.map((session) => session.score) : sessions.map((session) => session.bestSessionE1RM).filter(Boolean);
  const main = cardio
    ? last ? `Производительность ${formatWeight(last.performanceScore || last.score)}` : "Недостаточно данных"
    : last?.bestSessionE1RM ? `Расч. максимум ${formatWeight(last.bestSessionE1RM)} кг` : "Недостаточно данных";
  const trend = sessions.length < 2
    ? "Недостаточно данных для тренда"
    : sessions.length === 2
      ? "Тренд предварительный"
      : cardio ? trendText(last.score, previous.score) : e1rmDeltaText(last, previous);
  return `
    <section class="panel compact-progress-card">
      <div>
        <span>Прогресс упражнения</span>
        <strong>${main}</strong>
        <small>${trend}</small>
      </div>
      ${renderSparkline(values)}
      <button data-action="progress-exercise" data-id="${exercise.id}">Подробнее</button>
    </section>
  `;
}

function e1rmDeltaText(last, previous) {
  if (!last) return "Недостаточно данных";
  if (!previous) return "первая тренировка";
  if (!previous.bestSessionE1RM) return "нет корректного сравнения";
  const delta = last.bestSessionE1RM - previous.bestSessionE1RM;
  if (Math.abs(delta) < 0.05) return "без изменений к прошлой тренировке";
  return `${delta > 0 ? "+" : "−"}${formatWeight(Math.abs(delta))} кг к прошлой тренировке`;
}

function strengthDeltaClass(last, previous) {
  if (!last || !previous || !previous.bestSessionE1RM) return "";
  const delta = last.bestSessionE1RM - previous.bestSessionE1RM;
  if (Math.abs(delta) < 0.05) return "";
  return delta > 0 ? "good" : "bad";
}

function strengthTrendWarning(sessions) {
  if (sessions.length <= 1) return "Пока есть только одна тренировка. Тренд появится после следующей.";
  if (sessions.length === 2) return "Тренд предварительный: всего 2 тренировки. Линия показывает только изменение между двумя точками, а не устойчивую тенденцию.";
  return "Тренд считается по истории упражнения.";
}

function strengthInsight(last, previous, sessions) {
  if (!previous) return "Есть первая точка. Следующая тренировка даст сравнение силы, тяжёлых подходов, тоннажа и запаса.";
  const parts = [];
  if (last.bestSessionE1RM && previous.bestSessionE1RM) {
    const delta = last.bestSessionE1RM - previous.bestSessionE1RM;
    if (delta > 0.05) parts.push(`Сила выросла: расчётный максимум +${formatWeight(delta)} кг.`);
    else if (delta < -0.05) parts.push(`Расчётный максимум снизился на ${formatWeight(Math.abs(delta))} кг. Это может быть усталость, меньший запас или обычное колебание.`);
    else parts.push("Расчётный максимум почти не изменился.");
  } else {
    parts.push("Для корректного сравнения силы пока не хватает валидных подходов.");
  }
  const hardDelta = last.hardSets - previous.hardSets;
  if (hardDelta > 0) parts.push(`Качественный объём вырос: +${hardDelta} тяж. подх.`);
  else if (hardDelta < 0) parts.push(`Тяжёлых подходов меньше: ${hardDelta} к прошлой тренировке.`);
  const tonnageDelta = last.tonnage - previous.tonnage;
  if (tonnageDelta > 0) parts.push(`Тоннаж вырос на ${formatWeight(tonnageDelta)} кг.`);
  else if (tonnageDelta < 0) parts.push(`Тоннаж ниже на ${formatWeight(Math.abs(tonnageDelta))} кг.`);
  const reserveDelta = last.avgReserve - previous.avgReserve;
  if (reserveDelta < -0.05) parts.push(`Средний запас снизился до ${formatWeight(last.avgReserve)} RIR — работа стала ближе к отказу.`);
  else if (reserveDelta > 0.05) parts.push(`Средний запас вырос до ${formatWeight(last.avgReserve)} RIR — тренировка была дальше от отказа.`);
  if (sessions.length === 2) parts.push("Вывод предварительный: истории пока мало.");
  return parts.join(" ");
}

function signedMetric(value, suffix = "") {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  if (Math.abs(value) < 0.05) return `0${suffix}`;
  return `${value > 0 ? "+" : "−"}${formatWeight(Math.abs(value))}${suffix}`;
}

function renderStrengthChanges(last, previous, sessions) {
  if (!previous) return `<section class="panel progress-note"><h2>С прошлого раза</h2><p class="muted">Это первая тренировка упражнения. Сравнение появится после следующей.</p></section>`;
  const strengthDelta = last.bestSessionE1RM && previous.bestSessionE1RM ? last.bestSessionE1RM - previous.bestSessionE1RM : null;
  const changes = [
    ["Сила", strengthDelta, signedMetric(strengthDelta, " кг")],
    ["Тяжёлые", last.hardSets - previous.hardSets, signedMetric(last.hardSets - previous.hardSets)],
    ["Объём", last.tonnage - previous.tonnage, signedMetric(last.tonnage - previous.tonnage, " кг")],
    ["Средний RIR", last.avgReserve - previous.avgReserve, signedMetric(last.avgReserve - previous.avgReserve)]
  ];
  return `
    <section class="panel progress-note structured-note">
      <div class="section-head"><h2>С прошлого раза</h2><span>${formatDate(previous.date)} → ${formatDate(last.date)}</span></div>
      <div class="change-grid">
        ${changes.map(([title, delta, value]) => `<div class="${delta == null || Math.abs(delta) < 0.05 ? "" : delta > 0 ? "good" : "bad"}"><span>${title}</span><strong>${value}</strong></div>`).join("")}
      </div>
      <button class="ghost explanation-toggle" data-action="toggle-progress-explanation">${progressExplanationOpen ? "Скрыть объяснение" : "Что это значит?"}</button>
      ${progressExplanationOpen ? `<div class="progress-explanation"><p>${strengthInsight(last, previous, sessions)}</p>${last.strengthRetention != null ? `<p class="muted">Сохранение силы: ${formatWeight(last.strengthRetention)}%. Показывает, насколько последний рабочий подход сохранил силу относительно лучшего подхода тренировки.</p>` : ""}</div>` : ""}
    </section>
  `;
}

function strengthChartConfig(tab, sessions) {
  const configs = {
    strength: {
      title: "Расчётный максимум",
      subtitle: "Лучший e1RM за тренировку.",
      type: "line",
      values: sessions.map((s) => s.bestSessionE1RM),
      details: sessions.map((s) => `${formatDate(s.date)} · e1RM ${s.bestSessionE1RM ? formatWeight(s.bestSessionE1RM) : "—"} кг`)
    },
    hard: {
      title: "Тяжёлые подходы",
      subtitle: "Рабочие подходы с запасом 0–3 RIR.",
      type: "bar",
      values: sessions.map((s) => s.hardSets),
      details: sessions.map((s) => `${formatDate(s.date)} · ${s.hardSets} тяж. подх.`)
    },
    tonnage: {
      title: "Тоннаж",
      subtitle: "Сумма вес × повторения без разминки.",
      type: "bar",
      values: sessions.map((s) => s.tonnage),
      details: sessions.map((s) => `${formatDate(s.date)} · ${formatWeight(s.tonnage)} кг`)
    },
    rir: {
      title: "Средний запас",
      subtitle: "Меньше = ближе к отказу. Само по себе снижение не является ухудшением.",
      type: "line",
      values: sessions.map((s) => s.avgReserve),
      details: sessions.map((s) => `${formatDate(s.date)} · ${formatWeight(s.avgReserve)} RIR`)
    }
  };
  return configs[tab] || configs.strength;
}

function renderStrengthChartTabs(active) {
  const tabs = [
    ["strength", "Сила"],
    ["hard", "Тяжёлые подходы"],
    ["tonnage", "Тоннаж"],
    ["rir", "Запас"]
  ];
  return `<div class="progress-tabs">${tabs.map(([key, title]) => `<button class="${active === key ? "active" : ""}" data-action="progress-tab" data-tab="${key}">${title}</button>`).join("")}</div>`;
}

function renderStrengthSessionSummary(session) {
  const key = `${session.date}:${session.top?.exerciseId || ""}`;
  const warmupsOpen = expandedProgressWarmups.has(key);
  const workList = session.workingSets.map((set) => {
    const excluded = !validE1rmSet(set);
    return `<li>${formatWeight(set.weight)} × ${set.reps} @RIR ${reserveValue(set)}${excluded ? ` <small>e1RM не считается: reps+RIR &gt; 15</small>` : ""}</li>`;
  }).join("");
  const warmups = session.warmupSets.map((set) => `<li>${formatWeight(set.weight)} × ${set.reps} @RIR ${reserveValue(set)}</li>`).join("");
  return `
    <article class="session-summary strength-session">
      <div>
        <strong>${formatDate(session.date)}</strong>
        <span>e1RM: ${session.bestSessionE1RM ? `${formatWeight(session.bestSessionE1RM)} кг` : "—"} · тяжёлые: ${session.hardSets} · тоннаж: ${formatWeight(session.tonnage)} кг · запас: ${formatWeight(session.avgReserve)} RIR</span>
      </div>
      <ul class="set-compact-list">${workList || "<li>Рабочих подходов нет.</li>"}</ul>
      ${session.warmupSets.length ? `<button class="ghost compact-toggle" data-action="toggle-progress-warmup" data-key="${key}">${warmupsOpen ? "Скрыть разминку" : "Показать разминку"}</button>` : ""}
      ${warmupsOpen ? `<ul class="set-compact-list warmup-list">${warmups}</ul>` : ""}
    </article>
  `;
}

function renderStrengthProgress(selected, tracked) {
  const sessions = progressForExercise(selected.id);
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const chartSessions = sessions.filter((s) => progressChartTab !== "strength" || s.bestSessionE1RM > 0);
  const chartConfig = strengthChartConfig(progressChartTab, chartSessions);
  const chartId = `chart-${chartRefs.length}`;
  if (chartSessions.length) {
    chartRefs.push({
      id: chartId,
      values: chartConfig.values,
      labels: chartSessions.map((s) => formatDate(s.date)),
      type: chartConfig.type,
      neutral: progressChartTab !== "strength",
      details: chartConfig.details
    });
  }
  return `
    <section class="progress-hero">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1>${selected.name}</h1>
        <div class="progress-subline">
          <span>${sessions.length} трен.</span>
          <span>${setsForExercise(selected.id).length} подх.</span>
          <span>${label(equipment, selected.equipmentType)}</span>
        </div>
      </div>
      <div class="progress-score ${strengthDeltaClass(last, previous)}">
        <span>Расчётный максимум</span>
        <strong>${last?.bestSessionE1RM ? `${formatWeight(last.bestSessionE1RM)} кг` : "—"}</strong>
        <small>${e1rmDeltaText(last, previous)}</small>
      </div>
    </section>
    <section class="progress-picker-shell">
      <div class="section-head"><h2>Выбор упражнения</h2><span class="legend-dot">${tracked.length} с историей</span></div>
      <div class="progress-picker">
        ${tracked.map(({ exercise, sessions: itemSessions }) => {
          const itemLast = itemSessions.at(-1);
          const itemPrev = itemSessions.at(-2);
          return `
            <button class="${exercise.id === selected.id ? "active" : ""}" data-action="select-progress-card" data-id="${exercise.id}">
              <span>${exercise.name}</span>
              <strong>${itemLast ? isCardioExercise(exercise) ? formatWeight(itemLast.score) : itemLast.bestSessionE1RM ? `${formatWeight(itemLast.bestSessionE1RM)} кг` : "—" : "—"}</strong>
              <small>${isCardioExercise(exercise) ? itemLast && itemPrev ? trendText(itemLast.score, itemPrev.score) : `${itemSessions.length} трен.` : e1rmDeltaText(itemLast, itemPrev)}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
    <section class="progress-mosaic">
      <div class="metric-tile strength"><span>Макс. вес</span><strong>${last ? `${formatWeight(last.maxWorkingWeight)} кг` : "—"}</strong><p>Среди рабочих подходов.</p></div>
      <div class="metric-tile volume"><span>Тяжёлые подходы</span><strong>${last ? last.hardSets : "—"}</strong><p>Рабочие подходы с запасом 0–3.</p></div>
      <div class="metric-tile reserve"><span>Средний запас</span><strong>${last ? `${formatWeight(last.avgReserve)} RIR` : "—"}</strong><p>Меньше = ближе к отказу.</p></div>
      <div class="metric-tile stability"><span>Тоннаж</span><strong>${last ? `${formatWeight(last.tonnage)} кг` : "—"}</strong><p>Без разминки.</p></div>
    </section>
    ${last ? renderStrengthChanges(last, previous, sessions) : ""}
    <section class="chart-panel primary-chart">
      <div class="section-head"><h2>${chartConfig.title}</h2><span class="legend-dot">${chartConfig.subtitle}</span></div>
      ${renderStrengthChartTabs(progressChartTab)}
      ${chartSessions.length > 1 ? `<canvas class="chart" id="${chartId}" height="250"></canvas><p class="muted">${strengthTrendWarning(sessions)}</p>` : `<p class="muted">${strengthTrendWarning(sessions)}</p>`}
    </section>
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${sessions.length ? `<div class="session-list">${sessions.slice(-6).reverse().map(renderStrengthSessionSummary).join("")}</div>` : `<p class="muted">Нет данных.</p>`}
    </section>
  `;
}

function rowingTrendWarning(sessions) {
  if (sessions.length <= 1) return "Пока есть только одна тренировка. Сравнение появится после следующей.";
  if (sessions.length === 2) return "Тренд предварительный: всего 2 тренировки. Линия показывает только изменение между двумя точками, а не устойчивую тенденцию.";
  return "";
}

function rowingInsight(last, previous, sessions) {
  const distanceText = formatDistanceKm(last.distanceKm);
  const durationText = formatDuration(last.durationSec);
  const paceText = formatDuration(last.pace500Sec);
  const projectedText = formatDuration(last.projected3000Sec);
  if (!previous) {
    return `Первая точка по гребле: ${distanceText} за ${durationText}, средний темп ${paceText}/500 м. 3000 м по этому темпу — ${projectedText}. Сравнение появится после следующей тренировки.`;
  }
  const parts = [];
  const performanceDelta = last.performanceScore - previous.performanceScore;
  if (Math.abs(performanceDelta) < 0.05) parts.push("Производительность почти не изменилась.");
  else parts.push(`Производительность ${performanceDelta > 0 ? "выросла" : "снизилась"} на ${formatWeight(Math.abs(performanceDelta))}.`);

  const paceDelta = last.pace500Sec - previous.pace500Sec;
  if (Math.abs(paceDelta) >= 0.5) {
    parts.push(`Темп ${paceDelta < 0 ? "улучшился" : "стал медленнее"} на ${Math.round(Math.abs(paceDelta))} сек/500 м.`);
  } else {
    parts.push("Темп почти не изменился.");
  }

  const distanceDeltaM = last.distanceM - previous.distanceM;
  if (Math.abs(distanceDeltaM) >= 1) {
    parts.push(`Дистанция ${distanceDeltaM > 0 ? "выросла" : "стала меньше"} на ${formatDistanceMeters(Math.abs(distanceDeltaM))}.`);
  }

  const projectedDelta = last.projected3000Sec - previous.projected3000Sec;
  if (Math.abs(projectedDelta) >= 0.5) {
    parts.push(`Расчётные 3000 м ${projectedDelta < 0 ? "быстрее" : "медленнее"} на ${Math.round(Math.abs(projectedDelta))} сек.`);
  }

  if (sessions.length === 2) parts.push("Тренд предварительный: всего 2 тренировки.");
  return parts.join(" ");
}

function rowingChartConfig(tab, sessions) {
  const configs = {
    performance: {
      title: "Производительность",
      subtitle: "Больше = лучше.",
      type: "line",
      values: sessions.map((s) => s.performanceScore),
      details: sessions.map((s) => `${formatDate(s.date)} · производительность ${formatWeight(s.performanceScore)} · ${formatDistanceKm(s.distanceKm)}`),
      yFormat: formatWeight
    },
    pace: {
      title: "Темп /500 м",
      subtitle: "Ниже = быстрее.",
      type: "line",
      invert: true,
      values: sessions.map((s) => s.pace500Sec),
      details: sessions.map((s) => `${formatDate(s.date)} · темп ${formatDuration(s.pace500Sec)}/500 м · ${formatDuration(s.durationSec)}`),
      yFormat: formatDuration
    },
    distance: {
      title: "Дистанция",
      subtitle: "Дистанция за сессию.",
      type: "bar",
      neutral: true,
      values: sessions.map((s) => s.distanceKm),
      details: sessions.map((s) => `${formatDate(s.date)} · ${formatDistanceKm(s.distanceKm)} · ${formatDuration(s.durationSec)}`),
      yFormat: (value) => `${formatWeight(value)} км`
    },
    projected3000: {
      title: "3000 м",
      subtitle: "Расчётное время на 3000 м по текущему среднему темпу. Ниже = лучше.",
      type: "line",
      invert: true,
      values: sessions.map((s) => s.projected3000Sec),
      details: sessions.map((s) => `${formatDate(s.date)} · 3000 м по темпу ${formatDuration(s.projected3000Sec)} · темп ${formatDuration(s.pace500Sec)}/500 м`),
      yFormat: formatDuration
    }
  };
  return configs[tab] || configs.performance;
}

function renderRowingChartTabs(active) {
  const tabs = [
    ["performance", "Производительность"],
    ["pace", "Темп"],
    ["distance", "Дистанция"],
    ["projected3000", "3000 м"]
  ];
  return `<div class="progress-tabs rowing-tabs">${tabs.map(([key, title]) => `<button class="${active === key ? "active" : ""}" data-action="cardio-progress-tab" data-tab="${key}">${title}</button>`).join("")}</div>`;
}

function renderRowingSessionSummary(session) {
  const sessions = progressForExercise(session.top.exerciseId);
  const bestScore = Math.max(...sessions.map((item) => item.performanceScore));
  const best = Math.abs(session.performanceScore - bestScore) < 0.05;
  const settingsText = session.settings.length ? `настройка ${session.settings.join(", ")}` : "настройка не указана";
  return `
    <article class="session-summary rowing-session">
      <div>
        <strong>${formatDate(session.date)}${best ? " · лучший" : ""}</strong>
        <span>${session.count} зап. · ${settingsText}</span>
      </div>
      <div>
        <strong>${formatDistanceKm(session.distanceKm)} · ${formatDuration(session.durationSec)} · темп ${formatDuration(session.pace500Sec)}/500 м</strong>
        <span>3000 м по темпу: ${formatDuration(session.projected3000Sec)} · Производительность: ${formatWeight(session.performanceScore)}</span>
      </div>
    </article>
  `;
}

function renderRowingProgress(selected, tracked) {
  const sessions = progressForExercise(selected.id);
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const delta = last && previous ? last.performanceScore - previous.performanceScore : null;
  const chartSessions = sessions.filter((s) => Number.isFinite(Number(s.performanceScore)));
  const chartConfig = rowingChartConfig(cardioProgressTab, chartSessions);
  const chartId = `chart-${chartRefs.length}`;
  if (chartSessions.length) {
    chartRefs.push({
      id: chartId,
      values: chartConfig.values,
      labels: chartSessions.map((s) => formatDate(s.date)),
      type: chartConfig.type,
      invert: chartConfig.invert,
      neutral: chartConfig.neutral,
      details: chartConfig.details,
      yFormat: chartConfig.yFormat
    });
  }
  return `
    <section class="progress-hero rowing-hero">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1>Гребля</h1>
        <div class="progress-subline">
          <span>${sessions.length} трен.</span>
          <span>${setsForExercise(selected.id).length} зап.</span>
          <span>Кардио</span>
        </div>
      </div>
      <div class="progress-score ${deltaClass(delta)}">
        <span>Производительность</span>
        <strong>${last ? formatWeight(last.performanceScore) : "—"}</strong>
        <small class="${deltaClass(delta)}">${performanceDeltaText(last, previous)}</small>
      </div>
    </section>
    <section class="progress-picker-shell">
      <div class="section-head"><h2>Выбор упражнения</h2><span class="legend-dot">${tracked.length} с историей</span></div>
      <div class="progress-picker">
        ${tracked.map(({ exercise, sessions: itemSessions }) => {
          const itemLast = itemSessions.at(-1);
          const itemPrev = itemSessions.at(-2);
          const itemDelta = itemLast && itemPrev ? itemLast.score - itemPrev.score : null;
          return `
            <button class="${exercise.id === selected.id ? "active" : ""}" data-action="select-progress-card" data-id="${exercise.id}">
              <span>${exercise.name}</span>
              <strong>${itemLast ? formatWeight(itemLast.performanceScore || itemLast.score) : "—"}</strong>
              <small>${itemDelta == null ? `${itemSessions.length} трен.` : trendText(itemLast.score, itemPrev.score)}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
    <section class="progress-mosaic rowing-metrics">
      <div class="metric-tile strength"><span>Дистанция</span><strong>${last ? formatDistanceKm(last.distanceKm) : "—"}</strong><p>за последнюю сессию</p></div>
      <div class="metric-tile volume"><span>Время</span><strong>${last ? formatDuration(last.durationSec) : "—"}</strong><p>мин:сек работы</p></div>
      <div class="metric-tile reserve"><span>Темп /500 м</span><strong>${last ? formatDuration(last.pace500Sec) : "—"}</strong><p>ниже = быстрее</p></div>
      <div class="metric-tile stability"><span>3000 м</span><strong>${last ? formatDuration(last.projected3000Sec) : "—"}</strong><p>по текущему среднему темпу</p></div>
    </section>
    ${last ? `<section class="panel progress-note"><h2>Вывод</h2><p>${rowingInsight(last, previous, sessions)}</p><p class="muted">Производительность — условный индекс сессии: растёт, когда дистанция больше и/или средний темп быстрее. Используется только для сравнения своих тренировок между собой.</p></section>` : ""}
    <section class="chart-panel primary-chart">
      <div class="section-head"><h2>${chartConfig.title}</h2><span class="legend-dot">${chartConfig.subtitle}</span></div>
      ${renderRowingChartTabs(cardioProgressTab)}
      ${chartSessions.length ? `<canvas class="chart" id="${chartId}" height="250"></canvas><p class="muted">${cardioProgressTab === "pace" ? "Средний темп на 500 м. В гребле меньшее время означает более высокую скорость." : cardioProgressTab === "projected3000" ? "Если бы ты держал этот же темп 3000 м, получилось бы примерно такое время." : cardioProgressTab === "performance" ? "Условный индекс: больше = лучше. Учитывает дистанцию и среднюю скорость." : "Дистанция не окрашивается как хорошо или плохо: цели сессий могут отличаться."}</p>` : `<p class="muted">Нет данных.</p>`}
    </section>
    ${chartSessions.length <= 2 ? `<section class="panel trend-warning"><p>${rowingTrendWarning(chartSessions)}</p></section>` : ""}
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${sessions.length ? `<div class="session-list">${sessions.slice(-6).reverse().map(renderRowingSessionSummary).join("")}</div>` : `<p class="muted">Нет данных.</p>`}
    </section>
  `;
}

function renderProgress(selectedId) {
  const tracked = trackedExercises();
  const selected = tracked.find((item) => item.exercise.id === selectedId)?.exercise || tracked[0]?.exercise;
  if (!selected) {
    return `
      <section class="progress-hero empty-progress">
        <div>
          <p class="eyebrow">Прогресс</p>
          <h1>Здесь появится динамика после первых подходов</h1>
        </div>
        <button class="primary" data-action="home">Записать упражнение</button>
      </section>
    `;
  }
  const selectedIsCardio = isCardioExercise(selected);
  if (!selectedIsCardio) return renderStrengthProgress(selected, tracked);
  const selectedIsRowing = isRowingExercise(selected);
  if (selectedIsRowing) return renderRowingProgress(selected, tracked);
  const sessions = progressForExercise(selected.id);
  const last = sessions.at(-1);
  const previous = sessions.at(-2);
  const scoreChart = `chart-${chartRefs.length}`;
  chartRefs.push({
    id: scoreChart,
    values: sessions.map((s) => s.score),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "line",
    pointValues: selectedIsCardio ? null : sessions.map((s) => s.avgReserve),
    details: sessions.map((s) => selectedIsCardio
      ? `${formatDate(s.date)} · ${formatWeight(s.score)} производительность · ${formatDuration(s.durationSec)}`
      : `${formatDate(s.date)} · e1RM ${formatWeight(s.score)} кг · пик ${formatWeight(s.pureE1rm)} кг 1ПМ · ${s.workCount} рабочих`)
  });
  const volumeChart = `chart-${chartRefs.length}`;
  chartRefs.push({
    id: volumeChart,
    values: sessions.map((s) => selectedIsCardio ? s.distanceKm : s.tonnage),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "bar",
    details: sessions.map((s) => selectedIsCardio
      ? `${formatDate(s.date)} · ${formatDistanceKm(s.distanceKm)} · ${formatDuration(s.durationSec)}`
      : `${formatDate(s.date)} · ${formatWeight(s.tonnage)} кг×повт · ${s.workCount} рабочих`)
  });
  const reserveChart = `chart-${chartRefs.length}`;
  chartRefs.push({
    id: reserveChart,
    values: sessions.map((s) => selectedIsCardio ? selectedIsRowing ? rowingSplit500(s) : s.speedKmh : s.avgReserve),
    labels: sessions.map((s) => formatDate(s.date)),
    type: "line",
    invert: selectedIsRowing,
    details: sessions.map((s) => selectedIsCardio
      ? selectedIsRowing
        ? `${formatDate(s.date)} · Темп /500 м ${formatDuration(rowingSplit500(s))} · ${rowing3000Label(s)}`
        : `${formatDate(s.date)} · ${formatWeight(s.speedKmh)} км/ч · темп ${formatPace(s.pace)}`
      : `${formatDate(s.date)} · запас ${formatWeight(s.avgReserve)} · ${s.workCount} рабочих`)
  });
  const fatigueValues = sessions.map((s) => s.fatigue).filter((v) => v != null);
  const fatigueChart = `chart-${chartRefs.length}`;
  const fatigueSessions = sessions.filter((s) => s.fatigue != null);
  chartRefs.push({
    id: fatigueChart,
    values: fatigueValues,
    labels: fatigueSessions.map((s) => formatDate(s.date)),
    type: "line",
    invert: true,
    details: fatigueSessions.map((s) => `${formatDate(s.date)} · падение ${formatWeight(s.fatigue)} · меньше лучше`)
  });
  return `
    <section class="progress-hero">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1>${selected.name}</h1>
        <div class="progress-subline">
          <span>${sessions.length} трен.</span>
          <span>${setsForExercise(selected.id).length} ${selectedIsCardio ? "зап." : "подх."}</span>
          <span>${label(equipment, selected.equipmentType)}</span>
        </div>
      </div>
      <div class="progress-score">
        <span>Производительность</span>
        <strong>${last ? formatWeight(last.score) : "—"}</strong>
        <small>${last && previous ? trendText(last.score, previous.score) : "Нужна ещё одна точка"}</small>
      </div>
    </section>
    <section class="progress-picker-shell">
      <div class="section-head"><h2>Выбор упражнения</h2><span class="legend-dot">${tracked.length} с историей</span></div>
      <div class="progress-picker">
        ${tracked.map(({ exercise, sessions: itemSessions }) => {
          const itemLast = itemSessions.at(-1);
          const itemPrev = itemSessions.at(-2);
          const delta = itemLast && itemPrev ? itemLast.score - itemPrev.score : null;
          return `
            <button class="${exercise.id === selected.id ? "active" : ""}" data-action="select-progress-card" data-id="${exercise.id}">
              <span>${exercise.name}</span>
              <strong>${itemLast ? formatWeight(itemLast.score) : "—"}</strong>
              <small>${delta == null ? `${itemSessions.length} трен.` : trendText(itemLast.score, itemPrev.score)}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
    <section class="progress-mosaic">
      <div class="metric-tile strength"><span>${selectedIsCardio ? "Дистанция" : "Пик силы"}</span><strong>${last ? selectedIsCardio ? formatDistanceKm(last.distanceKm) : `${formatWeight(last.pureE1rm)} кг` : "—"}</strong><p>${selectedIsCardio ? "за последнюю сессию" : "лучший чистый 1ПМ"}</p></div>
      <div class="metric-tile volume"><span>${selectedIsCardio ? "Время" : "Объём"}</span><strong>${last ? selectedIsCardio ? formatDuration(last.durationSec) : formatWeight(last.tonnage) : "—"}</strong><p>${selectedIsCardio ? "мин:сек работы" : "рабочие кг×повт"}</p></div>
      <div class="metric-tile reserve"><span>${selectedIsCardio ? selectedIsRowing ? "Темп /500 м" : "Скорость" : "Запас"}</span><strong>${last ? selectedIsCardio ? selectedIsRowing ? formatDuration(rowingSplit500(last)) : `${formatWeight(last.speedKmh)} км/ч` : formatWeight(last.avgReserve) : "—"}</strong><p>${selectedIsCardio ? selectedIsRowing ? "ниже = быстрее" : "средняя" : "средний RIR 0-10"}</p></div>
      <div class="metric-tile stability"><span>${selectedIsCardio ? selectedIsRowing ? "3000 м" : "Темп" : "Серия"}</span><strong>${last ? selectedIsCardio ? selectedIsRowing ? formatDuration(row3000Equivalent(last)) : formatPace(last.pace) : last.fatigue != null ? formatWeight(last.fatigue) : "—" : "—"}</strong><p>${selectedIsCardio ? selectedIsRowing ? "эквивалент по темпу" : "мин/км" : "падение меньше = лучше"}</p></div>
    </section>
    ${last ? `<section class="panel progress-note">${renderProgressNote(last, previous, selected)}</section>` : ""}
    <section class="chart-grid">
      <div class="chart-panel primary-chart"><div class="section-head"><h2>Производительность</h2><span class="legend-dot">дистанция + скорость</span></div>${sessions.length ? `<canvas class="chart" id="${scoreChart}" height="250"></canvas><p class="muted">Условный индекс сессии: растёт, когда дистанция больше и/или средний темп быстрее. Используется только для сравнения своих тренировок между собой.</p>` : `<p class="muted">Нет данных.</p>`}</div>
      <div class="chart-panel"><div class="section-head"><h2>${selectedIsCardio ? "Дистанция" : "Объём"}</h2><span class="legend-dot">${selectedIsCardio ? "км" : "рабочие подходы"}</span></div>${sessions.length ? `<canvas class="chart" id="${volumeChart}" height="210"></canvas><p class="muted">${selectedIsCardio ? "Сколько километров набрано за сессию." : "Сколько работы сделано за день."}</p>` : `<p class="muted">Нет данных.</p>`}</div>
      <div class="chart-panel"><div class="section-head"><h2>${selectedIsCardio ? selectedIsRowing ? "Темп /500 м" : "Скорость" : "Запас"}</h2><span class="legend-dot">${selectedIsCardio ? selectedIsRowing ? "ниже = быстрее" : "км/ч" : "0 отказ · 10 легко"}</span></div>${sessions.length ? `<canvas class="chart" id="${reserveChart}" height="210"></canvas><p class="muted">${selectedIsCardio ? selectedIsRowing ? "Средний темп на 500 м. В гребле меньшее время означает более высокую скорость." : "Средняя скорость по времени и дистанции." : "Та же работа с большим запасом = прогресс."}</p>` : `<p class="muted">Нет данных.</p>`}</div>
      ${selectedIsCardio ? "" : `<div class="chart-panel"><div class="section-head"><h2>Устойчивость</h2><span class="legend-dot">ниже лучше</span></div>${fatigueValues.length ? `<canvas class="chart" id="${fatigueChart}" height="210"></canvas><p class="muted">Насколько проседает серия от первого рабочего подхода к последнему.</p>` : `<p class="muted">Нужны хотя бы два рабочих подхода в тренировке.</p>`}</div>`}
    </section>
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${sessions.length ? `<div class="session-list">${sessions.slice(-6).reverse().map(renderSessionSummary).join("")}</div>` : `<p class="muted">Нет данных.</p>`}
    </section>
  `;
}

function renderProgressNote(last, previous, exercise) {
  if (last.type === "cardio") {
    const rowEquivalent = isRowingExercise(exercise) ? row3000Equivalent(last) : null;
    const split500 = isRowingExercise(exercise) ? rowingSplit500(last) : null;
    if (!previous) {
      return `
        <h2>Вывод</h2>
        <p class="muted">${rowEquivalent ? `Первая точка по гребле: Темп /500 м ${formatDuration(split500)}, ${rowing3000Label(last)}. ${rowNormsText()}` : "Есть первая кардио-точка. Следующая тренировка даст сравнение скорости, дистанции и времени."}</p>
      `;
    }
    const speedDelta = last.speedKmh - previous.speedKmh;
    const distanceDelta = last.distanceKm - previous.distanceKm;
    const durationDelta = last.durationSec - previous.durationSec;
    return `
      <h2>Вывод</h2>
      <p>${speedDelta >= 0 ? "средняя скорость выше" : "средняя скорость ниже"}, ${distanceDelta >= 0 ? "дистанция выше" : "дистанция ниже"}, ${durationDelta >= 0 ? "времени больше" : "времени меньше"}.</p>
      ${rowEquivalent ? `<p class="muted">Гребля: Темп /500 м ${formatDuration(split500)}, ${rowing3000Label(last)}. ${rowNormsText()}</p>` : ""}
      <div class="mini-metrics">
        <span>${trendText(last.speedKmh, previous.speedKmh, " км/ч")}</span>
        <span>${trendText(last.distanceKm, previous.distanceKm, " км")}</span>
        <span>${trendText(last.durationSec, previous.durationSec, " сек")}</span>
      </div>
    `;
  }
  if (!previous) {
    return `<h2>Вывод</h2><p class="muted">Есть первая точка. Следующая тренировка даст сравнение.</p>`;
  }
  const scoreDelta = last.score - previous.score;
  const volumeDelta = last.tonnage - previous.tonnage;
  const reserveDelta = last.avgReserve - previous.avgReserve;
  const parts = [
    scoreDelta >= 0 ? "производительность выросла" : "производительность снизилась",
    volumeDelta >= 0 ? "объём выше" : "объём ниже",
    reserveDelta >= 0 ? "запаса больше" : "запаса меньше"
  ];
  return `
    <h2>Вывод</h2>
    <p>${parts.join(", ")}.</p>
    <div class="mini-metrics">
      <span>${trendText(last.score, previous.score)}</span>
      <span>${trendText(last.tonnage, previous.tonnage, " объём")}</span>
      <span>${trendText(last.avgReserve, previous.avgReserve, " запас")}</span>
    </div>
  `;
}

function renderSessionSummary(session) {
  const pr = session.score === Math.max(...progressForExercise(session.top.exerciseId).map((item) => item.score));
  if (session.type === "cardio") {
    const exercise = state.exercises.find((item) => item.id === session.top.exerciseId);
    const rowing = isRowingExercise(exercise);
    return `
      <article class="session-summary">
        <div>
          <strong>${formatDate(session.date)}${pr ? " · лучший" : ""}</strong>
          <span>${session.count} зап. · ${formatDuration(session.durationSec)}</span>
        </div>
        <div>
          <strong>${formatDistanceKm(session.distanceKm)} · ${rowing ? `Темп /500 м ${formatDuration(rowingSplit500(session))}` : `${formatWeight(session.speedKmh)} км/ч`}</strong>
          <span>${rowing ? rowing3000Label(session) : `${formatWeight(session.score)} производительность · темп ${formatPace(session.pace)}`}</span>
        </div>
      </article>
    `;
  }
  return `
    <article class="session-summary">
      <div>
        <strong>${formatDate(session.date)}${pr ? " · лучший" : ""}</strong>
        <span>${session.count} подх. · запас ${formatWeight(session.avgReserve)}</span>
      </div>
      <div>
        <strong>${formatWeight(session.top.weight)} кг × ${session.top.reps}</strong>
        <span>e1RM ${formatWeight(session.score)} · ${formatWeight(session.tonnage)} объём</span>
      </div>
    </article>
  `;
}

function renderHistory() {
  const byDate = setsByDay();
  const recentDays = [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  const visibleDays = [...byDate.entries()]
    .filter(([key]) => key.startsWith(monthKey(historyCursor)))
    .sort((a, b) => b[0].localeCompare(a[0]));
  return `
    <section class="progress-top history-top">
      <h1>История</h1>
      <button data-action="toggle-calendar">${historyCalendarOpen ? "Скрыть календарь" : "Открыть календарь"}</button>
    </section>
    ${historyCalendarOpen ? `
      <section class="calendar-shell">
        <div class="month-controls calendar-controls">
          <button data-action="history-month" data-delta="-1">←</button>
          <strong>${monthTitle(historyCursor)}</strong>
          <button data-action="history-month" data-delta="1">→</button>
        </div>
        <div class="panel">${renderCalendar(byDate)}</div>
      </section>
      ${visibleDays.length ? visibleDays.map(([key, items]) => renderHistoryDay(key, items)).join("") : `<section class="panel"><p class="muted">В этом месяце тренировок нет.</p></section>`}
    ` : `
      <section class="history-recent-head"><div><p class="eyebrow">Быстрый доступ</p><h2>Последние тренировки</h2></div><span>${recentDays.length}</span></section>
      ${recentDays.length ? recentDays.map(([key, items]) => renderHistoryDay(key, items)).join("") : `<section class="panel"><p class="muted">История пока пустая.</p></section>`}
    `}
  `;
}

function renderCalendar(byDate) {
  const first = new Date(historyCursor.getFullYear(), historyCursor.getMonth(), 1);
  const last = new Date(historyCursor.getFullYear(), historyCursor.getMonth() + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push(new Date(historyCursor.getFullYear(), historyCursor.getMonth(), day));
  }
  const week = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return `
    <div class="calendar">
      ${week.map((item) => `<span class="weekday">${item}</span>`).join("")}
      ${cells.map((date) => {
        if (!date) return `<span></span>`;
        const key = dayKey(date.getTime());
        const items = byDate.get(key) || [];
        const summary = daySummary(items);
        return `
          <button class="calendar-day ${items.length ? "has-training" : ""} ${activeHistoryDay === key ? "selected" : ""}" data-action="history-day" data-day="${key}">
            <strong>${date.getDate()}</strong>
            ${items.length ? `<small title="${summary.exerciseCount} упр.">${summary.exerciseCount}</small>` : ""}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderHistoryDay(key, items) {
  const expanded = activeHistoryDay === key;
  const title = new Intl.DateTimeFormat(currentLanguage === "et" ? "et-EE" : "ru-RU", { day: "numeric", month: "long", weekday: "long" }).format(new Date(items[0].createdAt));
  const summary = daySummary(items);
  const groups = groupSetsByWorkout(items);
  return `
    <section class="panel history-day">
      <button class="day-toggle" data-action="history-day" data-day="${key}">
        <span><strong>${title}</strong><small>${summary.exerciseCount} упр. · ${summary.workCount} рабочих · ${formatWeight(summary.tonnage)} кг×повт${summary.cardioCount ? ` · ${formatDistanceKm(summary.distanceKm)}` : ""}</small></span>
        <span>${expanded ? "Свернуть" : "Открыть"}</span>
      </button>
      ${expanded ? exerciseGroupsForDay(items).map(({ exerciseId, exercise, sets, metrics }) => {
        const exerciseKey = `${key}:${exerciseId}`;
        const exerciseExpanded = expandedHistoryExercises.has(exerciseKey);
        const cardio = metrics.type === "cardio";
        return `
          <article class="history-exercise">
            <button class="exercise-toggle" data-action="history-exercise" data-key="${exerciseKey}">
              <span>${exercise?.name || "Удалённое упражнение"}</span>
              <small>${cardio ? `${metrics.count} зап. · ${formatDuration(metrics.durationSec)} · ${formatDistanceKm(metrics.distanceKm)}` : `${metrics.workCount} раб. · ${formatWeight(metrics.tonnage)} объём · ${metrics.top ? `${formatWeight(metrics.top.weight)} × ${metrics.top.reps}` : "нет рабочих"}`}</small>
            </button>
            ${exerciseExpanded ? `<div class="sets-list">${sets.map(renderSetRow).join("")}</div>` : ""}
          </article>
        `;
      }).join("") : ""}
      ${expanded ? `<label class="day-note">Заметка к дню<textarea rows="2" data-day-note="${key}" placeholder="Как прошла тренировка?">${state.dayNotes[key] || ""}</textarea></label>` : ""}
    </section>
  `;
}

function renderSettings() {
  const days = setsByDay().size;
  const storageKb = Math.round(new Blob([JSON.stringify(state)]).size / 1024);
  return `
    <section class="progress-top settings-top">
      <div><p class="eyebrow">Приложение</p><h1>Настройки</h1></div>
      <button data-action="check-update">Проверить обновления</button>
    </section>
    <section class="panel preference-list">
      <div class="preference-row"><div><strong>Язык</strong><span>Текущий язык приложения</span></div><button data-action="language">${currentLanguage.toUpperCase()}</button></div>
      <div class="preference-row"><div><strong>Таймер отдыха</strong><span>Запускается после рабочего подхода</span></div><label class="switch"><input type="checkbox" data-setting="rest-timer" ${state.settings.restTimerEnabled ? "checked" : ""} /><span></span></label></div>
      ${state.settings.restTimerEnabled ? `<label class="timer-duration">Длительность отдыха<select data-setting="rest-seconds">${[60, 90, 120, 180].map((seconds) => `<option value="${seconds}" ${Number(state.settings.restTimerSeconds) === seconds ? "selected" : ""}>${seconds} сек</option>`).join("")}</select></label>` : ""}
    </section>
    <section class="panel">
      <h2>Резервная копия</h2>
      <p class="muted">Экспорт сохраняет упражнения, подходы, картинки и настройки в один JSON-файл.</p>
      <div class="actions settings-actions">
        <button class="primary" data-action="export">Скачать JSON</button>
        <label class="file-action">
          <span>Импорт JSON</span>
          <input type="file" accept="application/json,.json" data-action="import-file" />
        </label>
      </div>
    </section>
    <section class="panel technical-section">
      <button class="technical-toggle" data-action="toggle-technical"><span><strong>О приложении</strong><small>Хранилище, PWA и технические данные</small></span><b>${settingsTechnicalOpen ? "−" : "+"}</b></button>
      ${settingsTechnicalOpen ? `
        <section class="insight-grid compact-insights">
          <div class="insight"><span>Версия данных</span><strong>${state.schemaVersion || DATA_VERSION}</strong><p>Миграции применяются автоматически</p></div>
          <div class="insight"><span>Дней</span><strong>${days}</strong><p>Дни с записанными подходами</p></div>
          <div class="insight"><span>Подходов</span><strong>${state.sets.length}</strong><p>Все записи хранятся локально</p></div>
          <div class="insight"><span>Размер</span><strong>${storageKb} КБ</strong><p>Примерно в памяти браузера</p></div>
        </section>
        <div class="settings-list">
          <div><strong>Установка</strong><span>Кнопка установки появляется, когда браузер разрешает установку.</span></div>
          <div><strong>Обновления</strong><span>Приложение проверяет новый service worker при запуске и раз в минуту.</span></div>
          <div><strong>Оффлайн</strong><span>Последняя загруженная версия открывается без сети, данные остаются на устройстве.</span></div>
        </div>
      ` : ""}
    </section>
  `;
}

function bindEvents(root) {
  root.addEventListener("click", (event) => {
    if (route.name === "exercise" && keypadOpen && !event.target.closest("[data-form='set'][data-kind='strength']")) {
      keypadOpen = false;
      render();
    }
  });
  root.querySelectorAll("[data-action='home']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "home" })));
  root.querySelectorAll("[data-action='progress']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress" })));
  root.querySelectorAll("[data-action='history']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "history" })));
  root.querySelectorAll("[data-action='settings']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "settings" })));
  root.querySelectorAll("[data-action='language']").forEach((button) => button.addEventListener("click", () => {
      currentLanguage = currentLanguage === "et" ? "ru" : "et";
      saveState();
      document.querySelector(".update-prompt")?.remove();
      render();
      if (waitingServiceWorker) showUpdatePrompt(waitingServiceWorker);
    }));
  root.querySelectorAll("[data-action='toggle-favorite']").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const favorites = new Set(state.settings.favoriteExerciseIds || []);
    favorites.has(button.dataset.id) ? favorites.delete(button.dataset.id) : favorites.add(button.dataset.id);
    state.settings.favoriteExerciseIds = [...favorites];
    saveState();
    render();
  }));
  root.querySelectorAll("[data-action='toggle-form']").forEach((button) => button.addEventListener("click", () => {
    exerciseFormOpen = !exerciseFormOpen;
    render();
  }));
  root.querySelectorAll("[data-action='history-day']").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.day;
    activeHistoryDay = activeHistoryDay === key ? null : key;
    if (route.name !== "history") route = { name: "history" };
    const [year, month] = key.split("-").map(Number);
    historyCursor = new Date(year, month - 1, 1);
    render();
  }));
  root.querySelectorAll("[data-action='history-exercise']").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.key;
    expandedHistoryExercises.has(key) ? expandedHistoryExercises.delete(key) : expandedHistoryExercises.add(key);
    render();
  }));
  root.querySelectorAll("[data-action='history-month']").forEach((button) => button.addEventListener("click", () => {
    historyCursor = shiftMonth(historyCursor, Number(button.dataset.delta));
    render();
  }));
  root.querySelector("[data-action='toggle-calendar']")?.addEventListener("click", () => {
    historyCalendarOpen = !historyCalendarOpen;
    render();
  });
  root.querySelectorAll("[data-day-note]").forEach((input) => input.addEventListener("input", () => {
    state.dayNotes[input.dataset.dayNote] = input.value;
    saveState();
  }));
  root.querySelectorAll("[data-action='toggle-exercise-group']").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.group;
    expandedExerciseGroups.has(key) ? expandedExerciseGroups.delete(key) : expandedExerciseGroups.add(key);
    render();
  }));
  root.querySelectorAll("[data-open-exercise]").forEach((card) => card.addEventListener("click", () => {
    const exercise = state.exercises.find((item) => item.id === card.dataset.openExercise);
    draftSet = exercise && !isCardioExercise(exercise)
      ? suggestedDraftSet(exercise.id)
      : { weight: "", reps: "8", reserve: 2, warmup: false };
    strengthDraftDirty = false;
    pendingSuggestionType = null;
    keypadOpen = false;
    strengthOptionsOpen = false;
    rirExpanded = false;
    rirHelpOpen = false;
    draftNote = "";
    formError = "";
    setRoute({ name: "exercise", id: card.dataset.openExercise });
  }));
  root.querySelector("#search")?.addEventListener("input", (event) => {
    exerciseSearchQuery = event.target.value;
    render();
    window.setTimeout(() => {
      const search = document.querySelector("#search");
      search?.focus();
      search?.setSelectionRange(search.value.length, search.value.length);
    }, 0);
  });
  root.querySelector("[data-form='exercise']")?.addEventListener("submit", saveExercise);
  root.querySelectorAll("[data-image-input]").forEach((input) => input.addEventListener("change", () => {
    const text = input.closest(".file-picker")?.querySelector(".file-picker-text");
    if (text) text.textContent = input.files?.[0]?.name || localizeText("Выбрать файл");
  }));
  root.querySelector("[data-form='set']")?.addEventListener("submit", saveSet);
  root.querySelector("[data-action='toggle-strength-options']")?.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='strength']");
    if (form && !editingSetId) rememberStrengthForm(form);
    strengthOptionsOpen = !strengthOptionsOpen;
    render();
  });
  root.querySelector("[data-action='toggle-rir-help']")?.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='strength']");
    if (form && !editingSetId) rememberStrengthForm(form);
    rirHelpOpen = !rirHelpOpen;
    render();
  });
  root.querySelector("[data-action='toggle-rir-values']")?.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='strength']");
    if (form && !editingSetId) rememberStrengthForm(form);
    rirExpanded = !rirExpanded;
    render();
  });
  root.querySelectorAll("[data-action='set-type']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='strength']");
    if (!form) return;
    if (!editingSetId) rememberStrengthForm(form);
    const warmup = button.dataset.warmup === "true";
    form.elements.warmup.checked = warmup;
    draftSet.warmup = warmup;
    strengthDraftDirty = true;
    pendingSuggestionType = null;
    render();
  }));
  root.querySelectorAll("[name='note']").forEach((input) => input.addEventListener("input", () => {
    if (!editingSetId) draftNote = input.value;
  }));
  root.querySelector("[name='reserve']")?.addEventListener("input", (event) => {
    if (!editingSetId) draftSet.reserve = Number(event.target.value);
    strengthDraftDirty = true;
    pendingSuggestionType = null;
    syncReserveUi(root, Number(event.target.value));
    event.target.style.setProperty("--thumb-color", reserveColor(Number(event.target.value)));
    updateStrengthComparison(root);
  });
  root.querySelector("[name='warmup']")?.addEventListener("change", (event) => {
    const warmup = event.target.checked;
    if (!editingSetId) draftSet.warmup = warmup;
    if (strengthDraftDirty && !editingSetId) {
      pendingSuggestionType = warmup;
      render();
      return;
    }
    applySuggestedStrengthValues(root);
    strengthDraftDirty = false;
    pendingSuggestionType = null;
    updateStrengthComparison(root);
  });
  root.querySelectorAll("[data-set-field]").forEach((input) => {
    let clearTimer = null;
    input.addEventListener("focus", () => {
      activeSetField = input.dataset.setField;
      keypadOpen = true;
      root.querySelectorAll("[data-set-field]").forEach((item) => item.classList.toggle("active", item === input));
      render();
    });
    input.addEventListener("click", () => {
      activeSetField = input.dataset.setField;
      keypadOpen = true;
      root.querySelectorAll("[data-set-field]").forEach((item) => item.classList.toggle("active", item === input));
    });
    input.addEventListener("input", () => {
      if (!editingSetId) draftSet[input.dataset.setField] = input.value;
      strengthDraftDirty = true;
      pendingSuggestionType = null;
      updateStrengthComparison(root);
    });
    input.addEventListener("pointerdown", () => {
      const field = input.dataset.setField;
      clearTimer = window.setTimeout(() => {
        const currentInput = document.querySelector(`[data-set-field='${field}']`);
        if (currentInput) currentInput.value = "";
        if (!editingSetId) draftSet[field] = "";
        strengthDraftDirty = true;
        pendingSuggestionType = null;
        haptic(18);
        render();
      }, 520);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
      input.addEventListener(eventName, () => window.clearTimeout(clearTimer));
    });
  });
  root.querySelectorAll("[data-step-field]").forEach((button) => button.addEventListener("click", () => {
    const input = root.querySelector(`[name='${button.dataset.stepField}']`);
    const current = Number(String(input.value || 0).replace(",", "."));
    const next = Math.max(button.dataset.stepField === "weight" ? 1 : 1, current + Number(button.dataset.delta));
    input.value = button.dataset.stepField === "weight" ? formatWeight(next).replace(",", ".") : String(Math.round(next));
    if (!editingSetId) draftSet[button.dataset.stepField] = input.value;
    strengthDraftDirty = true;
    pendingSuggestionType = null;
    updateStrengthComparison(root);
  }));
  root.querySelectorAll("[data-key]").forEach((button) => button.addEventListener("click", () => {
    handleKeypad(button.dataset.key);
    updateStrengthComparison(root);
  }));
  root.querySelector("[data-action='toggle-keyboard']")?.addEventListener("click", () => {
    nativeKeyboard = !nativeKeyboard;
    keypadOpen = true;
    render();
    window.setTimeout(() => document.querySelector(`[data-set-field='${activeSetField}']`)?.focus(), 30);
  });
  root.querySelectorAll("[data-action='set-reserve']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set']");
    const reserve = Number(button.dataset.reserve);
    if (!form) return;
    form.elements.reserve.value = reserve;
    form.elements.warmup.checked = reserve >= 6;
    if (!editingSetId) {
      draftSet.reserve = reserve;
      draftSet.warmup = reserve >= 6;
    }
    syncReserveUi(root, reserve);
    applySuggestedStrengthValues(root);
    updateStrengthComparison(root);
  }));
  root.querySelectorAll("[data-action='set-reserve-only']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='strength']");
    const reserve = Number(button.dataset.reserve);
    if (!form) return;
    form.elements.reserve.value = reserve;
    if (!editingSetId) draftSet.reserve = reserve;
    strengthDraftDirty = true;
    pendingSuggestionType = null;
    syncReserveUi(root, reserve);
    updateStrengthComparison(root);
  }));
  root.querySelectorAll("[data-action='cardio-duration']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='cardio']");
    if (!form) return;
    form.elements.minutes.value = button.dataset.minutes || "0";
    form.elements.seconds.value = button.dataset.seconds || "0";
    if (!editingSetId) {
      draftCardio.minutes = form.elements.minutes.value;
      draftCardio.seconds = form.elements.seconds.value;
    }
  }));
  root.querySelectorAll("[data-action='cardio-distance']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='cardio']");
    if (!form) return;
    form.elements.distanceM.value = button.dataset.distance;
    if (!editingSetId) draftCardio.distanceM = button.dataset.distance;
  }));
  root.querySelectorAll("[data-action='cardio-setting']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set'][data-kind='cardio']");
    if (!form) return;
    form.elements.setting.value = button.dataset.setting;
    if (!editingSetId) draftCardio.setting = button.dataset.setting;
  }));
  root.querySelectorAll("[name='minutes'], [name='seconds'], [name='distanceM'], [name='setting']").forEach((input) => input.addEventListener("input", () => {
    const form = input.closest("[data-form='set'][data-kind='cardio']");
    if (!form || editingSetId) return;
    draftCardio[input.name] = input.value;
  }));
  root.querySelectorAll("[data-action='repeat-last'], [data-action='repeat-best'], [data-action='apply-set-chip']").forEach((button) => button.addEventListener("click", () => {
    const form = root.querySelector("[data-form='set']");
    form.elements.weight.value = button.dataset.weight;
    form.elements.reps.value = button.dataset.reps;
    form.elements.reserve.value = button.dataset.reserve;
    if (form.elements.warmup && button.dataset.warmup != null) form.elements.warmup.checked = button.dataset.warmup === "true";
    form.querySelectorAll("[data-action='set-type']").forEach((typeButton) => {
      const active = typeButton.dataset.warmup === String(form.elements.warmup?.checked || false);
      typeButton.classList.toggle("active", active);
      typeButton.setAttribute("aria-pressed", String(active));
    });
    draftSet = { ...draftSet, weight: button.dataset.weight, reps: button.dataset.reps, reserve: Number(button.dataset.reserve), warmup: form.elements.warmup?.checked || false };
    strengthDraftDirty = false;
    pendingSuggestionType = null;
    syncReserveUi(root, draftSet.reserve);
    updateStrengthComparison(root);
  }));
  root.querySelectorAll("[data-action='use-set']").forEach((row) => row.addEventListener("click", () => {
    const set = state.sets.find((item) => item.id === row.dataset.id);
    const form = root.querySelector("[data-form='set'][data-kind='strength']");
    if (!set || !form) return;
    form.elements.weight.value = set.weight;
    form.elements.reps.value = set.reps;
    form.elements.reserve.value = reserveValue(set);
    form.elements.warmup.checked = Boolean(set.warmup);
    form.querySelectorAll("[data-action='set-type']").forEach((typeButton) => {
      const active = typeButton.dataset.warmup === String(Boolean(set.warmup));
      typeButton.classList.toggle("active", active);
      typeButton.setAttribute("aria-pressed", String(active));
    });
    draftSet = { weight: String(set.weight), reps: String(set.reps), reserve: reserveValue(set), warmup: Boolean(set.warmup) };
    strengthDraftDirty = false;
    pendingSuggestionType = null;
    syncReserveUi(root, draftSet.reserve);
    updateStrengthComparison(root);
  }));
  root.querySelector("[data-action='apply-suggestion']")?.addEventListener("click", (event) => {
    const warmup = event.currentTarget.dataset.warmup === "true";
    draftSet = suggestedDraftSet(event.currentTarget.closest("[data-form='set']").dataset.id, { warmup });
    strengthDraftDirty = false;
    pendingSuggestionType = null;
    render();
  });
  root.querySelectorAll("[data-action='delete-set']").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteSet(button.dataset.id);
  }));
  root.querySelectorAll("[data-action='edit-set']").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    startEditSet(button.dataset.id);
  }));
  root.querySelector("[data-action='cancel-edit']")?.addEventListener("click", () => {
    finishSetEditing();
    render();
  });
  root.querySelectorAll("[data-action='progress-exercise']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress", id: button.dataset.id })));
  root.querySelectorAll("[data-action='select-progress-card']").forEach((button) => button.addEventListener("click", () => setRoute({ name: "progress", id: button.dataset.id })));
  root.querySelectorAll("[data-action='progress-tab']").forEach((button) => button.addEventListener("click", () => {
    progressChartTab = button.dataset.tab || "strength";
    render();
  }));
  root.querySelectorAll("[data-action='cardio-progress-tab']").forEach((button) => button.addEventListener("click", () => {
    cardioProgressTab = button.dataset.tab || "performance";
    render();
  }));
  root.querySelector("[data-action='toggle-progress-explanation']")?.addEventListener("click", () => {
    progressExplanationOpen = !progressExplanationOpen;
    render();
  });
  root.querySelectorAll("[data-action='toggle-progress-warmup']").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.key;
    expandedProgressWarmups.has(key) ? expandedProgressWarmups.delete(key) : expandedProgressWarmups.add(key);
    render();
  }));
  root.querySelector("[data-action='edit-exercise']")?.addEventListener("click", (event) => openEditDialog(event.currentTarget.dataset.id));
  root.querySelector("[data-action='close-exercise-editor']")?.addEventListener("click", () => {
    editingExerciseId = null;
    render();
  });
  root.querySelector("[data-action='delete-exercise']")?.addEventListener("click", (event) => deleteExercise(event.currentTarget.dataset.id));
  root.querySelector("[data-action='export']")?.addEventListener("click", exportJson);
  root.querySelector("[data-action='import-file']")?.addEventListener("change", importJson);
  root.querySelector("[data-action='check-update']")?.addEventListener("click", checkForUpdates);
  root.querySelector("[data-action='toggle-technical']")?.addEventListener("click", () => {
    settingsTechnicalOpen = !settingsTechnicalOpen;
    render();
  });
  root.querySelector("[data-setting='rest-timer']")?.addEventListener("change", (event) => {
    state.settings.restTimerEnabled = event.target.checked;
    saveState();
    if (!event.target.checked) stopRestTimer();
    else {
      render();
    }
  });
  root.querySelector("[data-setting='rest-seconds']")?.addEventListener("change", (event) => {
    state.settings.restTimerSeconds = Number(event.target.value);
    saveState();
  });
  root.querySelector("[data-action='undo-last']")?.addEventListener("click", undoLastChange);
  root.querySelector("[data-action='stop-timer']")?.addEventListener("click", stopRestTimer);
}

function handleKeypad(key) {
  const field = activeSetField === "reps" ? "reps" : "weight";
  const form = document.querySelector("[data-form='set']");
  let value = String(form?.elements[field]?.value || draftSet[field] || "");
  if (key === "clear") value = "";
  else if (key === "back") value = value.slice(0, -1);
  else if (key === "dot") {
    if (field === "weight" && !value.includes(".")) value = value ? `${value}.` : "0.";
  } else if (/^\d$/.test(key)) {
    if (field === "reps") {
      value = `${value}${key}`.replace(/^0+(?=\d)/, "").slice(0, 3);
    } else {
      const next = `${value}${key}`;
      const [whole, fraction = ""] = next.split(".");
      value = `${whole.slice(0, 3)}${next.includes(".") ? `.${fraction.slice(0, 1)}` : ""}`;
    }
  }
  if (form) {
    form.elements[field].value = value;
    if (!editingSetId) draftSet[field] = value;
  } else {
    draftSet[field] = value;
  }
  strengthDraftDirty = true;
  pendingSuggestionType = null;
}

async function saveExercise(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get("image");
  const image = file && file.size ? await fileToDataUrl(file) : "";
  const existing = form.dataset.id ? state.exercises.find((exercise) => exercise.id === form.dataset.id) : null;
  if (existing) {
    existing.name = String(data.get("name")).trim() || existing.name;
    existing.icon = String(data.get("icon")).trim() || existing.icon || "🏋️";
    existing.category = data.get("category");
    existing.equipmentType = data.get("equipmentType");
    if (image) existing.image = image;
    editingExerciseId = null;
  } else {
    state.exercises.push({
      id: uid(),
      name: String(data.get("name")).trim(),
      icon: String(data.get("icon")).trim() || "🏋️",
      image,
      category: data.get("category"),
      equipmentType: data.get("equipmentType"),
      createdAt: Date.now()
    });
  }
  exerciseFormOpen = false;
  saveState();
  haptic(12);
  notify(existing ? "Упражнение обновлено" : "Упражнение добавлено");
  render();
}

function saveSet(event) {
  event.preventDefault();
  const form = event.currentTarget;
  form.querySelector(".save-set")?.classList.add("is-saving");
  const data = new FormData(form);
  const existing = state.sets.find((set) => set.id === editingSetId);
  const previousSnapshot = existing ? structuredClone(existing) : null;
  const note = String(data.get("note") || "").trim();
  if (form.dataset.kind === "cardio") {
    const minutes = Number(data.get("minutes"));
    const seconds = Number(data.get("seconds") || 0);
    const distanceM = Number(data.get("distanceM"));
    const durationSec = minutes * 60 + seconds;
    const setting = String(data.get("setting") || "").trim();
    if (
      !Number.isInteger(minutes) ||
      !Number.isInteger(seconds) ||
      minutes < 0 ||
      seconds < 0 ||
      seconds > 59 ||
      durationSec <= 0 ||
      !Number.isFinite(distanceM) ||
      distanceM <= 0
    ) {
      formError = durationSec <= 0 ? "Время должно быть больше 0" : "Дистанция должна быть больше 0";
      render();
      return;
    }
    if (existing) {
      existing.type = "cardio";
      existing.durationSec = durationSec;
      existing.distanceM = Math.round(distanceM);
      existing.setting = setting;
      existing.note = note;
      delete existing.durationMin;
      delete existing.distanceKm;
      delete existing.weight;
      delete existing.reps;
      delete existing.reserve;
      delete existing.effort;
      delete existing.warmup;
      existing.updatedAt = Date.now();
      lastTouchedSetId = existing.id;
      finishSetEditing();
      notify("Кардио изменено", "success");
      undoRecord = { kind: "restore", snapshot: previousSnapshot, message: "Кардио изменено" };
    } else {
      const id = uid();
      state.sets.push({
        id,
        type: "cardio",
        exerciseId: form.dataset.id,
        durationSec,
        distanceM: Math.round(distanceM),
        setting,
        note,
        createdAt: Date.now()
      });
      lastTouchedSetId = id;
      draftCardio = { minutes: String(minutes), seconds: String(seconds), distanceM: String(Math.round(distanceM)), setting };
      draftNote = "";
      undoRecord = { kind: "delete", setId: id, message: "Кардио записано" };
      notify("Кардио записано", "success");
    }
    haptic([12, 30, 12]);
    formError = "";
    saveState();
    render();
    return;
  }
  const weight = Number(String(data.get("weight")).replace(",", "."));
  const reps = Number(data.get("reps"));
  const reserve = Number(data.get("reserve"));
  const warmup = data.get("warmup") === "on";
  const validation = validateStrengthDraft({ weight: data.get("weight"), reps: data.get("reps"), reserve, warmup });
  if (validation) {
    formError = validation;
    render();
    return;
  }
  if (existing) {
    existing.type = "strength";
    existing.weight = weight;
    existing.reps = reps;
    existing.reserve = reserve;
    existing.note = note;
    delete existing.durationSec;
    delete existing.distanceM;
    delete existing.durationMin;
    delete existing.distanceKm;
    delete existing.setting;
    delete existing.effort;
    existing.warmup = warmup;
    existing.updatedAt = Date.now();
    lastTouchedSetId = existing.id;
    finishSetEditing();
    strengthDraftDirty = false;
    pendingSuggestionType = null;
    keypadOpen = false;
    notify("Подход изменён", "success");
    undoRecord = { kind: "restore", snapshot: previousSnapshot, message: "Подход изменён" };
  } else {
    const id = uid();
    state.sets.push({
      id,
      type: "strength",
      exerciseId: form.dataset.id,
      weight,
      reps,
      reserve,
      warmup,
      note,
      createdAt: Date.now()
    });
    lastTouchedSetId = id;
    draftSet = suggestedDraftSet(form.dataset.id, { weight: String(weight), reps: String(reps), reserve, warmup });
    strengthDraftDirty = false;
    pendingSuggestionType = null;
    keypadOpen = false;
    draftNote = "";
    notify(warmup ? "Разминка записана" : "Подход записан", "success");
    undoRecord = { kind: "delete", setId: id, message: warmup ? "Разминка записана" : "Подход записан" };
  }
  haptic([12, 30, 12]);
  formError = "";
  saveState();
  if (!warmup) startRestTimer();
  render();
}

function undoLastChange() {
  if (!undoRecord) return;
  if (undoRecord.kind === "delete") {
    state.sets = state.sets.filter((set) => set.id !== undoRecord.setId);
    window.clearInterval(restTimerTick);
    restTimerTick = null;
    restTimerEnd = null;
  }
  if (undoRecord.kind === "restore" && undoRecord.snapshot) {
    const index = state.sets.findIndex((set) => set.id === undoRecord.snapshot.id);
    if (index >= 0) state.sets[index] = undoRecord.snapshot;
  }
  if (undoRecord.kind === "insert" && undoRecord.snapshot) {
    const index = Math.max(0, Math.min(Number(undoRecord.index) || 0, state.sets.length));
    state.sets.splice(index, 0, undoRecord.snapshot);
  }
  undoRecord = null;
  saveState();
  notify("Последнее действие отменено");
  render();
}

function deleteSet(id) {
  if (!confirm(localizeText("Удалить запись?"))) return;
  const index = state.sets.findIndex((set) => set.id === id);
  if (index < 0) return;
  const snapshot = { ...state.sets[index] };
  state.sets.splice(index, 1);
  undoRecord = { kind: "insert", snapshot, index, message: "Запись удалена" };
  if (editingSetId === id) finishSetEditing();
  saveState();
  haptic(20);
  notify("Запись удалена");
  render();
}

function startEditSet(id) {
  const set = state.sets.find((item) => item.id === id);
  if (!set) return;
  editingReturnRoute = route.name === "history"
    ? {
        name: "history",
        activeHistoryDay,
        historyCursor: historyCursor.toISOString()
      }
    : null;
  editingSetId = id;
  activeSetField = "weight";
  lastTouchedSetId = id;
  route = { name: "exercise", id: set.exerciseId };
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

function openEditDialog(id) {
  editingExerciseId = id;
  render();
}

function deleteExercise(id) {
  const hasSets = state.sets.some((set) => set.exerciseId === id);
  if (hasSets && !confirm(localizeText("У упражнения есть история. Удалить упражнение и все его подходы?"))) return;
  state.exercises = state.exercises.filter((exercise) => exercise.id !== id);
  state.sets = state.sets.filter((set) => set.exerciseId !== id);
  editingExerciseId = null;
  if (route.name === "exercise" && route.id === id) route = { name: "home" };
  saveState();
  render();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function exportJson() {
  const payload = { ...state, schemaVersion: DATA_VERSION, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `training-log-${dayKey(Date.now())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = migrateState(parsed);
    const replace = confirm(localizeText("Заменить текущие локальные данные импортированным файлом?"));
    if (!replace) return;
    state = imported;
    saveState();
    route = { name: "settings" };
    render();
  } catch {
    alert(localizeText("Не удалось прочитать JSON-файл."));
  } finally {
    event.target.value = "";
  }
}

async function checkForUpdates() {
  if (!serviceWorkerRegistration) {
    alert(localizeText("Service worker ещё не зарегистрирован."));
    return;
  }
  await serviceWorkerRegistration.update();
  if (serviceWorkerRegistration.waiting) {
    showUpdatePrompt(serviceWorkerRegistration.waiting);
  } else {
    alert(localizeText("Новая версия пока не найдена."));
  }
}

function drawCharts() {
  chartRefs.forEach((chart) => {
    const { id, values, labels, type, invert, pointValues, neutral, yFormat } = chart;
    const canvas = document.getElementById(id);
    if (!canvas || !values.length) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(320, rect.width || canvas.clientWidth || 0);
    const height = Number(canvas.getAttribute("height"));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    drawChart(ctx, width, height, values, labels, type, invert, pointValues, neutral, yFormat);
    bindChartTooltip(canvas, chart);
  });
}

function chartGeometry(width, height, values, type) {
  const pad = { l: 54, r: 38, t: 26, b: 36 };
  const chartW = Math.max(80, width - pad.l - pad.r);
  const chartH = Math.max(80, height - pad.t - pad.b);
  const max = Math.max(...values, 1);
  const min = type === "bar" ? 0 : Math.min(...values);
  const range = max - min || 1;
  return { pad, chartW, chartH, max, min, range };
}

function clampChartPoint(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawChart(ctx, width, height, values, labels, type, invert = false, pointValues = null, neutral = false, yFormat = formatWeight) {
  const { pad, chartW, chartH, max, min, range } = chartGeometry(width, height, values, type);
  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px system-ui";
  ctx.strokeStyle = "rgba(105, 115, 108, 0.18)";
  ctx.fillStyle = "#69736c";
  for (let i = 0; i < 5; i += 1) {
    const y = pad.t + (chartH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(width - pad.r, y);
    ctx.stroke();
    ctx.fillText(localizeText(yFormat(max - (range * i) / 4)), 4, y + 4);
  }
  const good = values.length < 2 || (invert ? values.at(-1) <= values.at(-2) : values.at(-1) >= values.at(-2));
  const color = neutral ? "#315d4f" : good ? "#1d775d" : "#c8543f";
  if (type === "bar") {
    const slot = chartW / values.length;
    values.forEach((value, index) => {
      const barH = ((value - min) / range) * chartH;
      const x = pad.l + slot * index + slot * 0.18;
      const y = pad.t + chartH - barH;
      const radius = 7;
      ctx.fillStyle = neutral ? "#315d4f" : index === values.length - 1 ? "#d99a32" : "#315d4f";
      roundRect(ctx, x, y, slot * 0.64, barH, radius);
      ctx.fill();
    });
  } else {
    const gradient = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
    gradient.addColorStop(0, `${color}2b`);
    gradient.addColorStop(1, `${color}00`);
    const area = new Path2D();
    values.forEach((value, index) => {
      const x = clampChartPoint(pad.l + (chartW * index) / Math.max(1, values.length - 1), pad.l + 7, pad.l + chartW - 7);
      const y = clampChartPoint(pad.t + chartH - ((value - min) / range) * chartH, pad.t + 8, pad.t + chartH - 8);
      if (index === 0) area.moveTo(x, pad.t + chartH);
      area.lineTo(x, y);
      if (index === values.length - 1) area.lineTo(x, pad.t + chartH);
    });
    area.closePath();
    ctx.fillStyle = gradient;
    ctx.fill(area);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = clampChartPoint(pad.l + (chartW * index) / Math.max(1, values.length - 1), pad.l + 7, pad.l + chartW - 7);
      const y = clampChartPoint(pad.t + chartH - ((value - min) / range) * chartH, pad.t + 8, pad.t + chartH - 8);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    values.forEach((value, index) => {
      const x = clampChartPoint(pad.l + (chartW * index) / Math.max(1, values.length - 1), pad.l + 7, pad.l + chartW - 7);
      const y = clampChartPoint(pad.t + chartH - ((value - min) / range) * chartH, pad.t + 8, pad.t + chartH - 8);
      ctx.fillStyle = pointValues ? reserveColor(pointValues[index]) : index === values.length - 1 ? "#f4f7f2" : color;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, index === values.length - 1 ? 6.5 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.fillStyle = "#69736c";
  labels.forEach((label, index) => {
    if (index !== 0 && index !== labels.length - 1 && index % Math.ceil(labels.length / 4) !== 0) return;
    const x = pad.l + (chartW * index) / Math.max(1, labels.length - 1);
    ctx.textAlign = index === 0 ? "left" : index === labels.length - 1 ? "right" : "center";
    ctx.fillText(label, clampChartPoint(x, pad.l, pad.l + chartW), height - 10);
  });
  ctx.textAlign = "left";
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function bindChartTooltip(canvas, chart) {
  canvas.onclick = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const index = nearestChartIndex(x, rect.width, chart.values, chart.type);
    if (index == null) return;
    showChartTooltip(canvas, chart.details?.[index] || `${chart.labels[index]} · ${formatWeight(chart.values[index])}`);
  };
}

function nearestChartIndex(x, width, values, type) {
  if (!values.length) return null;
  const { pad, chartW } = chartGeometry(width, 220, values, type);
  if (type === "bar") {
    const slot = chartW / values.length;
    return Math.max(0, Math.min(values.length - 1, Math.floor((x - pad.l) / slot)));
  }
  const ratio = (x - pad.l) / Math.max(1, chartW);
  return Math.max(0, Math.min(values.length - 1, Math.round(ratio * (values.length - 1))));
}

function showChartTooltip(canvas, text) {
  chartTooltip?.remove();
  const rect = canvas.getBoundingClientRect();
  chartTooltip = document.createElement("div");
  chartTooltip.className = "chart-tooltip";
  chartTooltip.textContent = localizeText(text);
  chartTooltip.style.left = `${Math.min(window.innerWidth - 18, Math.max(8, rect.left + 12))}px`;
  chartTooltip.style.top = `${Math.max(8, rect.top + window.scrollY + 12)}px`;
  document.body.append(chartTooltip);
  window.setTimeout(() => chartTooltip?.remove(), 3200);
}

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector(".install-button")?.removeAttribute("hidden");
});
document.addEventListener("click", async (event) => {
  if (!event.target.matches("[data-action='install']") || !deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt = null;
});
window.addEventListener("resize", drawCharts);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", registerServiceWorker);
}

render();

async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register("./sw.js");
  serviceWorkerRegistration = registration;

  if (registration.waiting) {
    showUpdatePrompt(registration.waiting);
  }

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        showUpdatePrompt(worker);
      }
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  setInterval(() => registration.update(), 60_000);
}

function showUpdatePrompt(worker) {
  waitingServiceWorker = worker;
  let prompt = document.querySelector(".update-prompt");
  if (!prompt) {
    prompt = document.createElement("div");
    prompt.className = "update-prompt";
    prompt.innerHTML = `
      <span>Доступна новая версия</span>
      <button type="button">Обновить</button>
    `;
    localizeUi(prompt);
    document.body.append(prompt);
    prompt.querySelector("button").addEventListener("click", () => {
      waitingServiceWorker?.postMessage({ type: "SKIP_WAITING" });
    });
  }
  prompt.hidden = false;
}
