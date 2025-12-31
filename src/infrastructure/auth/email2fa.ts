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
 * Envoie un code de vérification par email
 * @param email - Adresse email du destinataire
 * @param code - Code de vérification à envoyer
 * @returns Promise qui se résout quand l'email est envoyé
 */
export async function sendVerificationCodeByEmail(
  email: string,
  code: string
): Promise<void> {
  try {
    // Configuration du transporteur email
    // En développement, on peut utiliser un service comme Ethereal Email ou un SMTP réel
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true pour 465, false pour les autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Si pas de configuration SMTP, utiliser Ethereal Email en développement
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n📧 [DEV MODE] Configuration SMTP non trouvée, utilisation d'Ethereal Email");
        console.log(`📧 [DEV MODE] Code de vérification pour ${email}: ${code}\n`);
        
        // Créer un compte de test Ethereal Email
        const testAccount = await nodemailer.createTestAccount();
        transporter.close();
        
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
        console.log("✅ Message envoyé via Ethereal Email");
        console.log("📧 Message ID:", info.messageId);
        if (previewUrl) {
          console.log("🔗 Preview URL:", previewUrl);
        }
        console.log(`\n⚠️  IMPORTANT: En développement, le code est affiché ci-dessus: ${code}\n`);
        return;
      } else {
        throw new Error(
          "Configuration SMTP manquante. Veuillez configurer SMTP_USER et SMTP_PASSWORD dans les variables d'environnement."
        );
      }
    }

    // Envoi de l'email avec la configuration SMTP
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
          <p style="color: #6b7280; font-size: 14px;">
            Ce code est valide pendant 14 jours. Ne partagez jamais ce code avec personne.
          </p>
        </div>
      `,
    });

    console.log("✅ Email de vérification envoyé à %s", email);
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 [DEV MODE] Code de vérification pour ${email}: ${code}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Erreur lors de l'envoi de l'email de vérification:", errorMessage);
    // En développement, on peut continuer même si l'email échoue
    if (process.env.NODE_ENV === "development") {
      console.log(`\n⚠️  [DEV MODE] L'email a échoué, mais voici le code pour ${email}: ${code}\n`);
    } else {
      throw error;
    }
  }
}

/**
 * Envoie un code de réinitialisation de mot de passe par email
 * @param email - Adresse email du destinataire
 * @param code - Code de réinitialisation à envoyer
 * @returns Promise qui se résout quand l'email est envoyé
 */
export async function sendPasswordResetCodeByEmail(
  email: string,
  code: string
): Promise<void> {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpSecure = process.env.SMTP_SECURE === "true";

    console.log(`📧 Configuration SMTP: host=${smtpHost}, port=${smtpPort}, secure=${smtpSecure}, user=${smtpUser ? '***' : 'NON CONFIGURÉ'}`);

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Si pas de configuration SMTP, utiliser Ethereal Email en développement
    if (!smtpUser || !smtpPassword) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n📧 [DEV MODE] Configuration SMTP non trouvée, utilisation d'Ethereal Email");
        console.log(`🔑 [DEV MODE] Code de réinitialisation pour ${email}: ${code}\n`);
        
        const testAccount = await nodemailer.createTestAccount();
        transporter.close();
        
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
          subject: "Réinitialisation de mot de passe - Med-Connect",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
              <p>Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code suivant :</p>
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Ce code est valide pendant <strong>15 minutes</strong>. Ne partagez jamais ce code avec personne.
              </p>
              <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              </p>
            </div>
          `,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("✅ Message de réinitialisation envoyé via Ethereal Email");
        console.log("📧 Message ID:", info.messageId);
        if (previewUrl) {
          console.log("🔗 Preview URL:", previewUrl);
        }
        console.log(`\n⚠️  IMPORTANT: En développement, le code est affiché ci-dessus: ${code}\n`);
        return;
      } else {
        throw new Error(
          "Configuration SMTP manquante. Veuillez configurer SMTP_USER et SMTP_PASSWORD dans les variables d'environnement."
        );
      }
    }

    // Vérifier la connexion SMTP avant d'envoyer
    try {
      await transporter.verify();
      console.log("✅ Connexion SMTP vérifiée avec succès");
    } catch (verifyError: any) {
      console.error("❌ Erreur de vérification SMTP:", verifyError.message || verifyError);
      throw new Error(`Erreur de connexion SMTP: ${verifyError.message || verifyError}`);
    }

    // Envoi de l'email avec la configuration SMTP
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Med-Connect" <noreply@medconnect.local>',
      to: email,
      subject: "Réinitialisation de mot de passe - Med-Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code suivant :</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Ce code est valide pendant <strong>15 minutes</strong>. Ne partagez jamais ce code avec personne.
          </p>
          <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
      `,
    };

    console.log(`📤 Envoi de l'email à ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de réinitialisation envoyé à %s", email);
    console.log("📧 Message ID:", info.messageId);
    if (process.env.NODE_ENV === "development") {
      console.log(`🔑 [DEV MODE] Code de réinitialisation pour ${email}: ${code}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Erreur lors de l'envoi de l'email de réinitialisation:", errorMessage);
    // En développement, on peut continuer même si l'email échoue
    if (process.env.NODE_ENV === "development") {
      console.log(`\n⚠️  [DEV MODE] L'email a échoué, mais voici le code pour ${email}: ${code}\n`);
    } else {
      throw error;
    }
  }
}

/**
 * Vérifie un code de vérification
 * @param providedCode - Code fourni par l'utilisateur
 * @param storedCode - Code stocké en base de données
 * @param expirationTime - Date d'expiration du code
 * @returns true si le code est valide et n'a pas expiré
 */
export function verifyCode(
  providedCode: string,
  storedCode: string | null | undefined,
  expirationTime: Date | null | undefined
): boolean {
  // Vérifier que le code stocké existe
  if (!storedCode) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[verifyCode] Code stocké manquant: ${storedCode}`);
    }
    return false;
  }

  // Vérifier que le code n'a pas expiré
  if (expirationTime && new Date() > expirationTime) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[verifyCode] Code expiré. Expiration: ${expirationTime.toISOString()}, Actuel: ${new Date().toISOString()}`);
    }
    return false;
  }

  // Normaliser les codes en string et comparer
  const normalizedProvided = String(providedCode).trim();
  const normalizedStored = String(storedCode).trim();
  
  if (process.env.NODE_ENV === "development") {
    console.log(`[verifyCode] Comparaison: "${normalizedProvided}" === "${normalizedStored}" ? ${normalizedProvided === normalizedStored}`);
  }
  
  return normalizedProvided === normalizedStored;
}

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param length - Longueur du mot de passe (défaut: 12)
 * @returns Mot de passe généré
 */
export function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  // S'assurer qu'on a au moins un caractère de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Remplir le reste avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Envoie un mot de passe par email
 * @param email - Adresse email du destinataire
 * @param password - Mot de passe à envoyer
 * @param nom - Nom du destinataire
 * @returns Promise qui se résout quand l'email est envoyé
 */
export async function sendPasswordByEmail(
  email: string,
  password: string,
  nom?: string
): Promise<void> {
  try {
    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Si pas de configuration SMTP, utiliser Ethereal Email en développement
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n📧 [DEV MODE] Configuration SMTP non trouvée, utilisation d'Ethereal Email");
        console.log(`🔑 [DEV MODE] Mot de passe pour ${email}: ${password}\n`);
        
        const testAccount = await nodemailer.createTestAccount();
        transporter.close();
        
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
          subject: "Votre compte Med-Connect a été validé",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Bienvenue sur Med-Connect${nom ? `, ${nom}` : ''} !</h2>
              <p>Votre demande d'inscription a été validée par un administrateur.</p>
              <p>Vous pouvez maintenant accéder à votre compte avec les identifiants suivants :</p>
              <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 10px 0;"><strong>Email/Téléphone :</strong> ${email}</p>
                <p style="margin: 10px 0;"><strong>Mot de passe :</strong></p>
                <div style="background-color: #ffffff; padding: 15px; text-align: center; margin: 10px 0; border: 2px dashed #2563eb; border-radius: 4px;">
                  <code style="font-size: 18px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">${password}</code>
                </div>
              </div>
              <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
                <strong>⚠️ Important :</strong> Veuillez changer ce mot de passe après votre première connexion.
              </p>
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Se connecter
                </a>
              </p>
            </div>
          `,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("✅ Message de mot de passe envoyé via Ethereal Email");
        console.log("📧 Message ID:", info.messageId);
        if (previewUrl) {
          console.log("🔗 Preview URL:", previewUrl);
        }
        console.log(`\n⚠️  IMPORTANT: En développement, le mot de passe est affiché ci-dessus: ${password}\n`);
        return;
      } else {
        throw new Error(
          "Configuration SMTP manquante. Veuillez configurer SMTP_USER et SMTP_PASSWORD dans les variables d'environnement."
        );
      }
    }

    // Envoi de l'email avec la configuration SMTP
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Med-Connect" <noreply@medconnect.local>',
      to: email,
      subject: "Votre compte Med-Connect a été validé",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenue sur Med-Connect${nom ? `, ${nom}` : ''} !</h2>
          <p>Votre demande d'inscription a été validée par un administrateur.</p>
          <p>Vous pouvez maintenant accéder à votre compte avec les identifiants suivants :</p>
          <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 10px 0;"><strong>Email/Téléphone :</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Mot de passe :</strong></p>
            <div style="background-color: #ffffff; padding: 15px; text-align: center; margin: 10px 0; border: 2px dashed #2563eb; border-radius: 4px;">
              <code style="font-size: 18px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">${password}</code>
            </div>
          </div>
          <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
            <strong>⚠️ Important :</strong> Veuillez changer ce mot de passe après votre première connexion.
          </p>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Se connecter
            </a>
          </p>
        </div>
      `,
    });

    console.log("✅ Email de mot de passe envoyé à %s", email);
    if (process.env.NODE_ENV === "development") {
      console.log(`🔑 [DEV MODE] Mot de passe pour ${email}: ${password}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Erreur lors de l'envoi de l'email de mot de passe:", errorMessage);
    // En développement, on peut continuer même si l'email échoue
    if (process.env.NODE_ENV === "development") {
      console.log(`\n⚠️  [DEV MODE] L'email a échoué, mais voici le mot de passe pour ${email}: ${password}\n`);
    } else {
      throw error;
    }
  }
}

/**
 * Envoie un email de rejet d'inscription à un médecin
 * @param email - Adresse email du destinataire
 * @param nom - Nom du médecin
 * @param motif - Motif du rejet (optionnel)
 * @returns Promise qui se résout quand l'email est envoyé
 */
export async function sendRejectionEmailByEmail(
  email: string,
  nom?: string,
  motif?: string
): Promise<void> {
  try {
    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Si pas de configuration SMTP, utiliser Ethereal Email en développement
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n📧 [DEV MODE] Configuration SMTP non trouvée, utilisation d'Ethereal Email");
        console.log(`❌ [DEV MODE] Email de rejet pour ${email}${nom ? ` (${nom})` : ''}${motif ? `\nMotif: ${motif}` : ''}\n`);
        
        const testAccount = await nodemailer.createTestAccount();
        transporter.close();
        
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
          subject: "Demande d'inscription rejetée - Med-Connect",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Demande d'inscription rejetée</h2>
              <p>Bonjour${nom ? ` ${nom}` : ''},</p>
              <p>Nous vous informons que votre demande d'inscription sur Med-Connect a été examinée et n'a malheureusement pas été acceptée.</p>
              ${motif ? `
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="color: #dc2626; margin-top: 0;">Motif du rejet :</h3>
                  <p style="color: #991b1b; margin-bottom: 0; white-space: pre-wrap;">${motif}</p>
                </div>
              ` : ''}
              <p>Si vous avez des questions ou souhaitez obtenir plus d'informations, n'hésitez pas à nous contacter.</p>
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Cordialement,<br>
                L'équipe Med-Connect
              </p>
            </div>
          `,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("✅ Email de rejet envoyé via Ethereal Email");
        console.log("📧 Message ID:", info.messageId);
        if (previewUrl) {
          console.log("🔗 Preview URL:", previewUrl);
        }
        return;
      } else {
        throw new Error(
          "Configuration SMTP manquante. Veuillez configurer SMTP_USER et SMTP_PASSWORD dans les variables d'environnement."
        );
      }
    }

    // Envoi de l'email avec la configuration SMTP
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Med-Connect" <noreply@medconnect.local>',
      to: email,
      subject: "Demande d'inscription rejetée - Med-Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Demande d'inscription rejetée</h2>
          <p>Bonjour${nom ? ` ${nom}` : ''},</p>
          <p>Nous vous informons que votre demande d'inscription sur Med-Connect a été examinée et n'a malheureusement pas été acceptée.</p>
          ${motif ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #dc2626; margin-top: 0;">Motif du rejet :</h3>
              <p style="color: #991b1b; margin-bottom: 0; white-space: pre-wrap;">${motif}</p>
            </div>
          ` : ''}
          <p>Si vous avez des questions ou souhaitez obtenir plus d'informations, n'hésitez pas à nous contacter.</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Cordialement,<br>
            L'équipe Med-Connect
          </p>
        </div>
      `,
    });

    console.log("✅ Email de rejet envoyé à %s", email);
    if (process.env.NODE_ENV === "development") {
      console.log(`❌ [DEV MODE] Email de rejet pour ${email}${nom ? ` (${nom})` : ''}${motif ? `\nMotif: ${motif}` : ''}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Erreur lors de l'envoi de l'email de rejet:", errorMessage);
    // En développement, on peut continuer même si l'email échoue
    if (process.env.NODE_ENV === "development") {
      console.log(`\n⚠️  [DEV MODE] L'email a échoué, mais voici le message de rejet pour ${email}${nom ? ` (${nom})` : ''}${motif ? `\nMotif: ${motif}` : ''}\n`);
    } else {
      throw error;
    }
  }
}

