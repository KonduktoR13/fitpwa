const COPY = {
  ru: {
    title: "Следующий подход",
    actions: {
      hold: "Оставить вес",
      increase: "Повысить вес",
      decrease: "Снизить вес",
      back_off: "Выполнить back-off",
      finish: "Закончить упражнение",
      insufficient_data: "Недостаточно данных"
    },
    reasons: {
      no_history: "По этому упражнению ещё нет рабочих подходов.",
      enter_starting_weight: "Введите комфортный исходный вес — тренер не будет угадывать его без истории.",
      use_user_starting_weight: "Истории пока нет, поэтому оставляю выбранный вами исходный вес.",
      limited_history_hold: "Истории пока мало. Разумнее повторить прошлый рабочий вес.",
      consolidate_new_weight: "Этот вес появился недавно. Сначала стоит уверенно закрепить его.",
      rolling_progress_confirmed: "Несколько последних тренировок устойчиво подтверждают верх целевого диапазона.",
      repeated_too_heavy: "В нескольких тренировках вес не позволил попасть в целевой диапазон с запасом.",
      long_gap_hold: "После большого перерыва безопаснее сначала повторить знакомый вес.",
      history_hold: "Последние тренировки не дают устойчивого сигнала для изменения веса.",
      clearly_easy_today: "Сегодняшний ранний подход оказался явно легче целевой зоны.",
      same_day_adjustment: "Это коррекция только для следующего подхода сегодня, а не автоматическая прогрессия на будущую тренировку.",
      early_set_too_heavy: "Ранний подход оказался ниже целевого диапазона и почти без запаса.",
      repeated_zero_rir: "Два последних подхода дошли до отказа. Продолжать тяжёлую работу сегодня не стоит.",
      severe_performance_drop: "Производительность резко снизилась при минимальном запасе повторений.",
      fatigue_at_typical_volume: "На фоне накопленной работы производительность и запас заметно снизились.",
      zero_rir_backoff: "Последний подход дошёл до отказа. Более лёгкий подход снизит накопленную усталость.",
      performance_below_expected: "Падение производительности сильнее обычного для этого упражнения.",
      fatigue_but_hold: "Есть усталость, но снижение пока не требует менять рабочий вес.",
      normal_set_fatigue: "Небольшое снижение между подходами соответствует обычному накоплению усталости.",
      today_in_target: "Сегодняшний подход находится в целевой зоне по повторам и запасу."
    },
    confidence: { low: "Низкая", medium: "Средняя", high: "Высокая" },
    confidenceHint: { low: "мало или противоречиво данных", medium: "есть полезная история", high: "данные достаточно последовательны" },
    targetRir: "Цель RIR",
    confidenceLabel: "Уверенность",
    apply: "Подставить",
    close: "Закрыть",
    why: "Почему?",
    safety: "Боль, головокружение или ухудшение техники — причина остановиться независимо от совета тренера.",
    finishHint: "Это совет, а не ограничение: форму можно закрыть и записать ещё один подход.",
    noApply: "Сначала задайте исходный рабочий вес в форме."
  },
  et: {
    title: "Järgmine seeria",
    actions: {
      hold: "Hoia raskust",
      increase: "Suurenda raskust",
      decrease: "Vähenda raskust",
      back_off: "Tee kergem seeria",
      finish: "Lõpeta harjutus",
      insufficient_data: "Andmeid pole piisavalt"
    },
    reasons: {
      no_history: "Selle harjutuse tööseeriaid veel pole.",
      enter_starting_weight: "Sisesta mugav algraskus — treener ei arva seda ilma ajaloota.",
      use_user_starting_weight: "Ajalugu veel pole, seega jätan sinu valitud algraskuse.",
      limited_history_hold: "Ajalugu on veel lühike. Mõistlik on korrata eelmist tööraskust.",
      consolidate_new_weight: "See raskus lisandus hiljuti. Kõigepealt tasub see kindlalt kinnistada.",
      rolling_progress_confirmed: "Mitu viimast treeningut kinnitavad järjekindlalt sihtvahemiku ülemist osa.",
      repeated_too_heavy: "Mitmel treeningul ei võimaldanud raskus jõuda sihtvahemikku piisava varuga.",
      long_gap_hold: "Pärast pikemat pausi on turvalisem tuttavat raskust korrata.",
      history_hold: "Viimased treeningud ei anna raskuse muutmiseks kindlat signaali.",
      clearly_easy_today: "Tänane varajane seeria oli sihttasemest selgelt kergem.",
      same_day_adjustment: "See on parandus ainult tänaseks järgmiseks seeriaks, mitte automaatne progressioon järgmiseks treeninguks.",
      early_set_too_heavy: "Varajane seeria jäi alla korduste sihi ja varu oli peaaegu otsas.",
      repeated_zero_rir: "Kaks viimast seeriat jõudsid suutlikkuse piirini. Rasket tööd ei tasu täna jätkata.",
      severe_performance_drop: "Sooritus langes järsult ja korduste varu on minimaalne.",
      fatigue_at_typical_volume: "Kogunenud töö järel langesid märgatavalt nii sooritus kui ka varu.",
      zero_rir_backoff: "Viimane seeria jõudis suutlikkuse piirini. Kergem seeria piirab lisaväsimust.",
      performance_below_expected: "Soorituse langus on selle harjutuse tavapärasest suurem.",
      fatigue_but_hold: "Väsimus on nähtav, kuid tööraskust pole veel vaja muuta.",
      normal_set_fatigue: "Väike langus seeriate vahel vastab tavapärasele väsimuse kogunemisele.",
      today_in_target: "Tänane seeria on korduste ja varu sihtalas."
    },
    confidence: { low: "Madal", medium: "Keskmine", high: "Kõrge" },
    confidenceHint: { low: "andmeid on vähe või need on vastuolulised", medium: "kasulikku ajalugu on olemas", high: "andmed on üsna järjepidevad" },
    targetRir: "RIR siht",
    confidenceLabel: "Kindlus",
    apply: "Täida väljad",
    close: "Sulge",
    why: "Miks?",
    safety: "Valu, pearinglus või tehnika halvenemine on põhjus lõpetada treeneri soovitusest sõltumata.",
    finishHint: "See on soovitus, mitte piirang: võid akna sulgeda ja järgmise seeria siiski salvestada.",
    noApply: "Määra esmalt vormil tööraskus."
  }
};

export function coachCopy(language) {
  return COPY[language === "et" ? "et" : "ru"];
}
export function formatCoachRecommendation(recommendation, language = "ru") {
  const copy = coachCopy(language);
  const reasonCodes = recommendation.reasonCodes || [];
  return {
    title: copy.title,
    action: copy.actions[recommendation.action] || recommendation.action,
    explanation: reasonCodes.map((code) => copy.reasons[code]).filter(Boolean).join(" "),
    confidence: copy.confidence[recommendation.confidence.level],
    confidenceHint: copy.confidenceHint[recommendation.confidence.level],
    copy
  };
}
