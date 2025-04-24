const fs = require('fs');
const path = require("path");
const { File } = require("megajs");
const AdmZip = require("adm-zip");
const axios = require("axios");

const downloadAndExtractMegaZip = (megaLink) => 
  new Promise((resolve, reject) => {
    try {
      console.log("Downloading Files...");
      const megaFile = File.fromURL(megaLink);
      const currentDirectory = process.cwd();
      const zipFilePath = path.join(currentDirectory, "temp.zip");

      megaFile.download((error, fileBuffer) => {
        if (error) {
          return reject(error);
        }

        fs.writeFileSync(zipFilePath, fileBuffer);
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(currentDirectory, true);
        fs.unlinkSync(zipFilePath);

        console.log("Connected Successfully ✅");
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });

const main = async () => {
  try {
    console.log("Fetching Zaynix data...");
    const response = await axios.get(
      "https://https://raw.githubusercontent.com/pakaya112/pakaya/refs/heads/main/detals.json"
    );
    const { zipmegalink } = response.data;

    console.log("Downloading and extracting files...");
    await downloadAndExtractMegaZip(zipmegalink);

    console.log("Executing...");
    require("./index.js");
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};

main();
