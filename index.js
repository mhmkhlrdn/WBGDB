// Run after generate-index

const fs = require("fs");
const path = require("path");

const CARDS_FILE = "./Site/cards.json";
const API_URL =
  "https://shadowverse-wb.com/web/CardList/cardList?offset={OFFSET}&class=0,1,2,3,4,5,6,7&cost=0,1,2,3,4,5,6,7,8,9,10&include_token=1";

let cardsData = {};
if (fs.existsSync(CARDS_FILE)) {
  cardsData = JSON.parse(fs.readFileSync(CARDS_FILE, "utf8"));
}

function normalizeName(key) {
  return key.replace(/_/g, " ");
}

function extractCommon(common) {
  return {
    card_id: common.card_id,
    card_set_id: common.card_set_id,
    type: common.type,
    class: common.class,
    is_token: common.is_token,
    atk: common.atk,
    life: common.life,
    cost: common.cost,
    rarity: common.rarity,
    cv: common.cv,
    illustrator: common.illustrator,
    flavour_text: common.flavour_text,
    skill_text: common.skill_text,
    card_image_hash: common.card_image_hash,
    card_banner_image_hash: common.card_banner_image_hash,
    base_art_url: `Art/${common.card_id}.png`,
  };
}

function extractEvo(jpEvo, evo, type, cardId) {
  return {
    card_resource_id: evo.card_resource_id,
    flavour_text: evo.flavour_text,
    jpFlavour_text: jpEvo.flavour_text,
    skill_text: evo.skill_text,
    jpSkill_text: jpEvo.skill_text,
    card_image_hash: evo.card_image_hash,
    jpCard_image_hash: jpEvo.card_image_hash,
    card_banner_image_hash: evo.card_banner_image_hash,
    ...(type === 1
      ? { evo_art_url: `Art/${cardId + 1}.png` }
      : {}),
  };
}

async function scrapeAndAppend() {
  for (let offset = 0; offset <= 570; offset += 30) {
    const url = API_URL.replace("{OFFSET}", offset);
    console.log(`🔎 Fetching offset ${offset}...`);

    const res = await fetch(url, { headers: { lang: "en" } });
    const json = await res.json();

    const jpRes = await fetch(url, { headers: { lang: "jp" } });
    const jpJson = await jpRes.json();

    const cardDetails = json?.data?.card_details || {};
    const relatedCards = json?.data?.cards || {};
    const jpCardDetails = jpJson?.data?.card_details || {};

    for (const cardId in cardDetails) {
      const card = cardDetails[cardId];
      const jpCard = jpCardDetails[cardId];
      const common = card.common;
      if (!common?.name) continue;

      const jpCommon = jpCardDetails[cardId]?.common;

      for (const key of Object.keys(cardsData)) {
        if (normalizeName(key) === common.name) {
          if (Array.isArray(cardsData[key])) {
            cardsData[key] = { voices: cardsData[key], metadata: {} };
          }

          const commonMeta = {
            ...extractCommon(card.common || {}),
            jpCard_image_hash: jpCommon?.card_image_hash || null,
            jpCV: jpCommon?.cv || null,
            jpName: jpCommon?.name || null,
            jpFlavour_Text: jpCommon?.flavour_text || null,
            jpSkill_Text: jpCommon?.skill_text || null,
            jpIllustrator: jpCommon?.illustrator || null,
            related_card_ids: relatedCards[cardId]?.related_card_ids || []
          };

          const evoMeta =
            card.evo && common.type === 1
              ? extractEvo(jpCard.evo, card.evo, common.type, common.card_id)
              : card.evo
                ? extractEvo(jpCard.evo, card.evo, common.type, common.card_id)
                : null;

          cardsData[key].metadata = {
            ...cardsData[key].metadata,
            common: commonMeta,
            evo: evoMeta,
          };

          console.log(`✅ Matched & updated: ${common.name}`);
        }
      }
    }
  }

  fs.writeFileSync(CARDS_FILE, JSON.stringify(cardsData, null, 2), "utf8");
  console.log("🎉 All done! Updated cards.json with metadata + evo + jpCV + art URLs.");
}

scrapeAndAppend().catch((err) => console.error(err));
