import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, "..", "post.html");

let t = fs.readFileSync(p, "utf8");

// Evita correr em ficheiros já recuperados para UTF-8 (latin1 sobre UTF-8 válido estraga texto).
const hasTypicalMojibake =
  /InÃ\xedcio|Vida 360Âº|Â© 2026|comentÃ¡rio|PolÃ­tica|ðŸ|â€¢|â€œ/u.test(t);
if (!hasTypicalMojibake) {
  console.log("post.html já está correto ou não tem marcadores de mojibake; nenhuma alteração.");
  process.exit(0);
}

let f = Buffer.from(t, "latin1").toString("utf8");

const shareBlock = `
        <div class="share-buttons" id="share-buttons" style="display: none;">
            <h3>&#128228; Compartilhe este artigo:</h3>
            <a href="#" class="share-btn whatsapp" onclick="shareWhatsApp(event)" title="Compartilhar no WhatsApp">
                &#128172; WhatsApp
            </a>
            <a href="#" class="share-btn facebook" onclick="shareFacebook(event)" title="Compartilhar no Facebook">
                &#128216; Facebook
            </a>
            <a href="#" class="share-btn twitter" onclick="shareTwitter(event)" title="Compartilhar no Twitter">
                &#128038; Twitter
            </a>
            <a href="#" class="share-btn linkedin" onclick="shareLinkedIn(event)" title="Compartilhar no LinkedIn">
                &#128188; LinkedIn
            </a>
            <a href="#" class="share-btn telegram" onclick="shareTelegram(event)" title="Compartilhar no Telegram">
                &#9992;&#65039; Telegram
            </a>
            <button type="button" class="share-btn copy-link" onclick="copyLinkToClipboard(event)" title="Copiar link">
                &#128203; Copiar Link
            </button>
        </div>`;

const reShare =
  /\r?\n        <div class="share-buttons" id="share-buttons"[^>]*>[\s\S]*?<\/div>\r?\n\r?\n        <!--/u;
if (!reShare.test(f)) {
  console.error("Could not find share-buttons block");
  process.exit(1);
}
f = f.replace(reShare, "\n" + shareBlock + "\n\n        <!--");

// Toast de cópia
f = f.replace(
  /btn\.textContent = '[^']*Link Copiado![^']*';/,
  "btn.textContent = '\\u2705 Link copiado!';"
);

fs.writeFileSync(p, f, "utf8");
console.log("post.html fixed:", p);
