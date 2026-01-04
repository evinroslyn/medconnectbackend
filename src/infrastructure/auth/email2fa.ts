import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Génère un code de vérification à 4 chiffres
 * @returns Code de vérification à 4 chiffres
 */
export function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Crée et configure le transporteur Nodemailer avec des options de robustesse
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Configuration de base pour Nodemailer
  const options: any = {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Options de robustesse pour éviter les Timeouts sur Render/Supabase
    connectionTimeout: 20000, // Augmenté à 20 secondes
    greetingTimeout: 20000,
    socketTimeout: 30000,
    family: 4, // Forcer l'IPv4 pour contourner les problèmes de résolution réseau
    debug: true, // Toujours activer le debug pour identifier la cause du timeout
    logger: true,
    tls: {
      // Ne pas échouer sur les problèmes de certificat (souvent utile avec certains serveurs SMTP)
      rejectUnauthorized: false
    }
  };

  console.log(`📧 Tentative de connexion SMTP: ${host}:${port} (secure: ${secure})`);
  return nodemailer.createTransport(options);
}

/**
 * Envoie un code de vérification par email
 * @param email - Adresse email du destinataire
 * @param code - Code de vérification à envoyer
 * @returns Promise qui se résout quand l'email est envoyé
 */
export async function sendVerificationCodeByEmail(
  email: string,
  code: string
): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  try {
    const transporter = createTransporter();

    // Si pas de configuration SMTP, utiliser Ethereal Email en développement
    if (!smtpUser || !smtpPassword) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n📧 [DEV MODE] Configuration SMTP non trouvée, utilisation d'Ethereal Email");
        const testAccount = await nodemailer.createTestAccount();
        const devTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await devTransporter.sendMail({
          from: '"Med-Connect" <noreply@medconnect.local>',
          to: email,
          subject: "Code de vérification Med-Connect",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Code de vérification</h2>
              <p>Votre code de vérification pour Med-Connect est :</p>
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #2563eb; font-size: 32px; margin: 0;">${code}</h1>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Ce code est valide pendant 14 jours. Ne partagez jamais ce code avec personne.
              </p>
            </div>
          `,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log("🔗 Preview URL:", previewUrl);
        return;
      } else {
        throw new Error("Configuration SMTP manquante (SMTP_USER/SMTP_PASSWORD).");
      }
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Med-Connect" <noreply@medconnect.local>',
      to: email,
      subject: "Code de vérification Med-Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Code de vérification</h2>
          <p>Votre code de vérification pour Med-Connect est :</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Ce code est valide pendant 14 jours.</p>
        </div>
      `,
    });
    console.log("✅ Email de vérification envoyé à %s", email);
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi de l'email de vérification:", error.message);
    if (process.env.NODE_ENV !== "development") throw error;
  }
}

/**
 * Envoie un code de réinitialisation de mot de passe par email
 */
export async function sendPasswordResetCodeByEmail(
  email: string,
  code: string
): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  try {
    const transporter = createTransporter();

    if (!smtpUser || !smtpPassword) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n📧 [DEV MODE] Code de réinitialisation: " + code);
        return;
      }
      throw new Error("Configuration SMTP manquante.");
    }

    await transporter.verify();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Med-Connect" <noreply@medconnect.local>',
      to: email,
      subject: "Réinitialisation de mot de passe - Med-Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
          <p>Utilisez le code suivant :</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Ce code est valide pendant 15 minutes.</p>
        </div>
      `,
    });
    console.log("✅ Email de réinitialisation envoyé à %s", email);
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi de l'email de réinitialisation:", error.message);
    if (process.env.NODE_ENV !== "development") throw error;
  }
}

/**
 * Vérifie un code de vérification
 */
export function verifyCode(
  providedCode: string,
  storedCode: string | null | undefined,
  expirationTime: Date | null | undefined
): boolean {
  if (!storedCode) return false;
  if (expirationTime && new Date() > expirationTime) return false;
  return String(providedCode).trim() === String(storedCode).trim();
}

/**
 * Génère un mot de passe aléatoire sécurisé
 */
export function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Envoie un mot de passe par email
 */
export async function sendPasswordByEmail(
  email: string,
  password: string,
  nom?: string
): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  try {
    const transporter = createTransporter();

    if (!smtpUser || !smtpPassword) {
      if (process.env.NODE_ENV === "development") {
        console.log(`🔑 [DEV MODE] Mot de passe pour ${email}: ${password}`);
        return;
      }
      throw new Error("Configuration SMTP manquante.");
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Med-Connect" <noreply@medconnect.local>',
      to: email,
      subject: "Votre compte Med-Connect a été validé",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenue sur Med-Connect${nom ? `, ${nom}` : ''} !</h2>
          <p>Votre demande d'inscription a été validée.</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe :</strong> <code>${password}</code></p>
          </div>
          <p style="color: #dc2626;">Veuillez changer ce mot de passe après votre première connexion.</p>
        </div>
      `,
    });
    console.log("✅ Email de mot de passe envoyé à %s", email);
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi de l'email de mot de passe:", error.message);
    throw error;
  }
}

/**
 * Envoie un email de rejet d'inscription
 */
export async function sendRejectionEmailByEmail(
  email: string,
  nom?: string,
  motif?: string
): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  try {
    const transporter = createTransporter();

    if (!smtpUser || !smtpPassword) {
      if (process.env.NODE_ENV === "development") {
        console.log(`❌ [DEV MODE] Email de rejet pour ${email}`);
        return;
      }
      throw new Error("Configuration SMTP manquante.");
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Med-Connect" <noreply@medconnect.local>',
      to: email,
      subject: "Demande d'inscription rejetée - Med-Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Demande d'inscription rejetée</h2>
          <p>Bonjour${nom ? ` ${nom}` : ''},</p>
          <p>Votre demande n'a malheureusement pas été acceptée.</p>
          ${motif ? `<p><strong>Motif :</strong> ${motif}</p>` : ''}
          <p>L'équipe Med-Connect</p>
        </div>
      `,
    });
    console.log("✅ Email de rejet envoyé à %s", email);
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi de l'email de rejet:", error.message);
    if (process.env.NODE_ENV !== "development") throw error;
  }
}
