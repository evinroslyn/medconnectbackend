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
 * Fonction interne pour envoyer un email via l'API HTTP de Brevo
 */
async function sendEmailViaBrevo(params: {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SMTP_USER || "votre-email@gmail.com";
  const senderName = "Med-Connect";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n📧 [DEV MODE] BREVO_API_KEY manquante. Contenu simulé :");
      console.log(`🔗 Destinataire: ${params.toEmail}`);
      console.log(`� Sujet: ${params.subject}`);
      return;
    }
    throw new Error("Configuration BREVO_API_KEY manquante dans les variables d'environnement.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: params.toEmail, name: params.toName || params.toEmail }],
      subject: params.subject,
      htmlContent: params.htmlContent
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erreur Brevo API (${response.status}): ${JSON.stringify(errorData)}`);
  }

  console.log(`✅ Email envoyé avec succès via Brevo à ${params.toEmail}`);
}

/**
 * Envoie un code de vérification par email
 */
export async function sendVerificationCodeByEmail(
  email: string,
  code: string
): Promise<void> {
  try {
    await sendEmailViaBrevo({
      toEmail: email,
      subject: "Code de vérification Med-Connect",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Code de vérification</h2>
          <p>Votre code de vérification pour Med-Connect est :</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Ce code est valide pendant 14 jours.</p>
        </div>
      `
    });
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
  try {
    await sendEmailViaBrevo({
      toEmail: email,
      subject: "Réinitialisation de mot de passe - Med-Connect",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
          <p>Utilisez le code suivant :</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Ce code est valide pendant 15 minutes.</p>
        </div>
      `
    });
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
  try {
    await sendEmailViaBrevo({
      toEmail: email,
      toName: nom,
      subject: "Votre compte Med-Connect a été validé",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenue sur Med-Connect${nom ? `, ${nom}` : ''} !</h2>
          <p>Votre demande d'inscription a été validée.</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe :</strong> <code>${password}</code></p>
          </div>
          <p style="color: #dc2626;">Veuillez changer ce mot de passe après votre première connexion.</p>
        </div>
      `
    });
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
  try {
    await sendEmailViaBrevo({
      toEmail: email,
      toName: nom,
      subject: "Demande d'inscription rejetée - Med-Connect",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Demande d'inscription rejetée</h2>
          <p>Bonjour${nom ? ` ${nom}` : ''},</p>
          <p>Votre demande n'a malheureusement pas été acceptée.</p>
          ${motif ? `<p><strong>Motif :</strong> ${motif}</p>` : ''}
          <p>L'équipe Med-Connect</p>
        </div>
      `
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi de l'email de rejet:", error.message);
    if (process.env.NODE_ENV !== "development") throw error;
  }
}

/**
 * Fonction interne pour envoyer un SMS via l'API HTTP de Brevo
 */
async function sendSMSViaBrevo(params: {
  recipient: string;
  content: string;
  tag?: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderName = process.env.SMS_SENDER_NAME || "MedConnect";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n📱 [DEV MODE] BREVO_API_KEY manquante. SMS simulé :");
      console.log(`🔗 Destinataire: ${params.recipient}`);
      console.log(`💬 Contenu: ${params.content}`);
      return;
    }
    throw new Error("Configuration BREVO_API_KEY manquante pour l'envoi de SMS.");
  }

  // Nettoyer le numéro de téléphone (doit être au format international sans le + pour Brevo transactional SMS, 
  // mais acceptons avec + car l'API semble le tolérer ou le requérir selon la doc)
  const recipient = params.recipient.startsWith('+') ? params.recipient : `+${params.recipient}`;

  const response = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: senderName.substring(0, 11), // Brevo limite le sender à 11 caractères alphanumériques
      recipient: recipient,
      content: params.content,
      type: "transactional"
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erreur Brevo SMS API (${response.status}): ${JSON.stringify(errorData)}`);
  }

  console.log(`✅ SMS envoyé avec succès via Brevo à ${params.recipient}`);
}

/**
 * Envoie un code de vérification par SMS
 */
export async function sendVerificationCodeBySMS(
  phoneNumber: string,
  code: string
): Promise<void> {
  try {
    await sendSMSViaBrevo({
      recipient: phoneNumber,
      content: `Votre code de vérification Med-Connect est : ${code}. Ce code est valide pendant 15 minutes.`
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi du SMS de vérification:", error.message);
    if (process.env.NODE_ENV !== "development") throw error;
  }
}

/**
 * Envoie un code de réinitialisation de mot de passe par SMS
 */
export async function sendPasswordResetCodeBySMS(
  phoneNumber: string,
  code: string
): Promise<void> {
  try {
    await sendSMSViaBrevo({
      recipient: phoneNumber,
      content: `Code de réinitialisation Med-Connect : ${code}. Valide 15 mins. Ne le partagez pas.`
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi du SMS de réinitialisation:", error.message);
    if (process.env.NODE_ENV !== "development") throw error;
  }
}
