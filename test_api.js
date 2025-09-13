const https = require("https");

const API_URL =
  "https://shadowverse-wb.com/web/CardList/cardList?offset=0&class=0,1,2,3,4,5,6,7&cost=0,1,2,3,4,5,6,7,8,9,10&exists_card_style=1";

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      })
      .on("error", (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
  });
}

async function testAPI() {
  try {
    console.log("Fetching API data...");
    const apiData = await fetchData(API_URL);

    console.log("API Response structure:");
    console.log("Keys in response:", Object.keys(apiData));

    if (apiData.data) {
      console.log("Keys in data:", Object.keys(apiData.data));

      if (apiData.data.card_details) {
        const cardIds = Object.keys(apiData.data.card_details);
        console.log(`Number of cards: ${cardIds.length}`);
        console.log("First few card IDs:", cardIds.slice(0, 5));

        const firstCardId = cardIds[0];
        const firstCard = apiData.data.card_details[firstCardId];
        console.log(`\nFirst card (ID: ${firstCardId}) structure:`);
        console.log("Keys:", Object.keys(firstCard));

        if (firstCard.style_card_list) {
          console.log(
            "style_card_list exists:",
            Array.isArray(firstCard.style_card_list)
          );
          console.log(
            "style_card_list length:",
            firstCard.style_card_list.length
          );
          if (firstCard.style_card_list.length > 0) {
            console.log(
              "First style card:",
              JSON.stringify(firstCard.style_card_list[0], null, 2)
            );
          }
        } else {
          console.log("No style_card_list found");
        }
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAPI();
