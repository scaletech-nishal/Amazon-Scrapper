import { apikey, sequence_id, showBrowser } from "./config";
import { browser } from "@crawlora/browser";

export default async function ({
  Keywords,
  Site,
}: {
  Keywords: string;
  Site: string;
}) {
  const formedData = Keywords.trim()
    .split("\n")
    .map((v) => v.trim());

  // Mapping of countries to Amazon URLs
  const amazonDomains: { [key: string]: string } = {
    "United Kingdom": "https://www.amazon.co.uk/",
    India: "https://www.amazon.in/",
    Australia: "https://www.amazon.com.au/",
    //"China (中国)": "https://www.amazon.cn/",
    "Turkey (Türkiye)": "https://www.amazon.com.tr/",
    "Italy (Italia)": "https://www.amazon.it/",
    "Netherlands (Nederland)": "https://www.amazon.nl/",
    "United States": "https://www.amazon.com/",
    "Spain (España)": "https://www.amazon.es/",
    Brazil: "https://www.amazon.com.br/",
    "Saudi Arabia (المملكة العربية السعودية)": "https://www.amazon.sa/",
    "Belgium (Belgique)": "https://www.amazon.com.be/",
    Egypt: "https://www.amazon.eg/",
    France: "https://www.amazon.fr/",
    Mexico: "https://www.amazon.com.mx/",
    Poland: "https://www.amazon.pl/",
    "United Arab Emirates": "https://www.amazon.ae/",
    Canada: "https://www.amazon.ca/",
    "Japan (日本)": "https://www.amazon.co.jp/",
    Germany: "https://www.amazon.de/",
    Sweden: "https://www.amazon.se/",
  };

  var amazonUrl = amazonDomains[Site];
  if (!amazonUrl) {
    throw new Error("Invalid Amazon site selected");
  }

  await browser(
    async ({ page, wait, output, debug }) => {
      for await (const key of formedData) {
        await page.goto(amazonUrl);
        debug(`Visiting Amazon website for ${Site}`);

        await wait(2);

        await page.type('input[name="field-keywords"]', key);
        debug(`Typing search query into the search bar`);

        await page.keyboard.press("Enter");
        debug(`Pressing Enter`);

        await page.waitForNavigation({ waitUntil: "networkidle2" });
        debug(`Waiting for page navigation`);

        const products = await page.$$eval(
          ".s-main-slot .s-result-item",
          (items: any) =>
            items.map((item: any) => {
              const productName =
                item.querySelector("h2 a span")?.textContent || "No Title";
              const productPage = item.querySelector("h2 a")?.href || "No Link";
              const productImage =
                item.querySelector(".s-image")?.src || "No Image";
              const ASIN = item.getAttribute("data-asin") || "No ASIN";
              const rating =
                item.querySelector(".a-icon-alt")?.textContent || "No Rating";
              const ratingCount =
                item.querySelector(".a-size-small .a-link-normal")
                  ?.textContent || "No Rating Count";
              const reviewPage =
                item.querySelector(".a-size-small .a-link-normal")?.href ||
                "No Link";
              const currentPrice =
                item.querySelector(".a-price .a-offscreen")?.textContent ||
                "No Price";
              const originalPrice =
                item.querySelector(".a-text-price .a-offscreen")?.textContent ||
                "No Original Price";
              let discount =
                item
                  .querySelector(".a-row.a-size-base.a-color-base")
                  ?.querySelector("div > div > span:first-of-type + span")
                  ?.textContent || "No Discount";

              discount = discount.replace(/[()]/g, "").trim();
              return {
                Product_name: productName,
                Product_page: productPage,
                Product_Image: productImage,
                ASIN,
                Rating: rating,
                Rating_count: ratingCount,
                Review_page: reviewPage,
                Current_price: currentPrice,
                Original_price: originalPrice,
                Discount: discount,
              };
            })
        );


        debug(`Fetching product titles and links`);
        await wait(2);
        debug(`Started submitting product data`);

        await Promise.all(
          products.map(async (product: any) => {
            await output.create({
              sequence_id,
              sequence_output: { Site: amazonUrl, ...product },
            });
          })
        );

        debug(`Submitted product data`);
      }
    },
    { showBrowser, apikey }
  );
}
