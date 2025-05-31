import * as yup from 'yup';

// Schema per login
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
  password: yup
    .string()
    .required('La password è obbligatoria'),
});

// Schema per registrazione
export const registerSchema = yup.object({
  name: yup
    .string()
    .required('Il nome è obbligatorio')
    .min(2, 'Il nome deve essere di almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri'),
  email: yup
    .string()
    .required('L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
  password: yup
    .string()
    .required('La password è obbligatoria')
    .min(6, 'La password deve essere di almeno 6 caratteri')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La password deve contenere almeno una lettera minuscola, una maiuscola e un numero'
    ),
  confirmPassword: yup
    .string()
    .required('Conferma la password')
    .oneOf([yup.ref('password')], 'Le password non coincidono'),
  familyName: yup
    .string()
        .required('Il nome della famiglia è obbligatorio')
        .min(2, 'Il nome famiglia deve avere almeno 2 caratteri')
        .max(50, 'Il nome famiglia non può superare i 50 caratteri'),
  createFamily: yup.boolean(),
});

// Schema per reset password
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('L\'email è obbligatoria')
    .email('Inserisci un\'email valida'),
});

// Schema per nuova password
export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('La password è obbligatoria')
    .min(6, 'La password deve avere almeno 6 caratteri')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La password deve contenere almeno una lettera minuscola, una maiuscola e un numero'
    ),
  confirmPassword: yup
    .string()
    .required('La conferma password è obbligatoria')
    .oneOf([yup.ref('password')], 'Le password non coincidono'),
});

// Schema per creazione famiglia
export const createFamilySchema = yup.object({
  name: yup
    .string()
    .required('Il nome della famiglia è obbligatorio')
    .min(2, 'Il nome deve essere di almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri'),
  description: yup
    .string()
    .max(500, 'La descrizione non può superare i 500 caratteri'),
});

// Schema per aggiornamento famiglia
export const updateFamilySchema = yup.object({
  name: yup
    .string()
    .required('Il nome della famiglia è obbligatorio')
    .min(2, 'Il nome famiglia deve avere almeno 2 caratteri')
    .max(100, 'Il nome famiglia non può superare i 100 caratteri'),
  description: yup
    .string()
    .max(500, 'La descrizione non può superare i 500 caratteri'),
  currency: yup
    .string()
    .oneOf(['EUR', 'USD', 'GBP'], 'Valuta non supportata'),
});

// Schema per invito membro famiglia
export const inviteMemberSchema = yup.object({
  email: yup
    .string()
    .email('Inserisci un\'email valida')
    .required('L\'email è obbligatoria'),
  role: yup
    .string()
    .oneOf(['admin', 'member'], 'Ruolo non valido')
    .required('Il ruolo è obbligatorio'),
});

// Schema per spesa
export const expenseSchema = yup.object({
  amount: yup
    .number()
    .required('L\'importo è obbligatorio')
    .positive('L\'importo deve essere positivo')
    .max(999999.99, 'L\'importo non può superare €999,999.99')
    .test('decimal', 'L\'importo può avere al massimo 2 decimali', (value) => {
      if (value === undefined) return true;
      return Number(value.toFixed(2)) === value;
    }),
  description: yup
    .string()
    .required('La descrizione è obbligatoria')
    .min(3, 'La descrizione deve essere di almeno 3 caratteri')
    .max(200, 'La descrizione non può superare i 200 caratteri'),
  categoryId: yup
    .string()
    .required('La categoria è obbligatoria'),
  date: yup
    .date()
    .required('La data è obbligatoria')
    .test('not-future', 'La data non può essere futura', function(value) {
      if (!value) return true;
      const today = new Date();
      const inputDate = new Date(value);
      // Confronta solo le date, ignorando l'orario
      today.setHours(23, 59, 59, 999);
      return inputDate <= today;
    }),
  notes: yup
    .string()
    .max(500, 'Le note non possono superare i 500 caratteri'),
  tags: yup
    .array()
    .of(yup.string().max(20, 'Ogni tag non può superare i 20 caratteri'))
    .max(10, 'Non puoi aggiungere più di 10 tag'),
});

// Schema per entrata
export const incomeSchema = yup.object({
  amount: yup
    .number()
    .required('L\'importo è obbligatorio')
    .positive('L\'importo deve essere positivo')
    .max(999999.99, 'L\'importo non può superare €999,999.99')
    .test('decimal', 'L\'importo può avere al massimo 2 decimali', (value) => {
      if (value === undefined) return true;
      return Number(value.toFixed(2)) === value;
    }),
  description: yup
    .string()
    .required('La descrizione è obbligatoria')
    .min(3, 'La descrizione deve essere di almeno 3 caratteri')
    .max(200, 'La descrizione non può superare i 200 caratteri'),
  source: yup
    .string()
    .required('La fonte è obbligatoria')
    .min(2, 'La fonte deve essere di almeno 2 caratteri')
    .max(100, 'La fonte non può superare i 100 caratteri'),
  date: yup
    .date()
    .required('La data è obbligatoria'),
  isRecurring: yup
    .boolean(),
  recurringType: yup
    .string()
    .when('isRecurring', {
      is: true,
      then: (schema) => schema
        .required('Il tipo di ricorrenza è obbligatorio')
        .oneOf(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'], 'Tipo di ricorrenza non valido'),
      otherwise: (schema) => schema.notRequired(),
    }),
  recurringEndDate: yup
    .date()
    .when('isRecurring', {
      is: true,
      then: (schema) => schema
        .required('La data di fine ricorrenza è obbligatoria')
        .min(yup.ref('date'), 'La data di fine deve essere successiva alla data di inizio'),
      otherwise: (schema) => schema.notRequired(),
    }),
  notes: yup
    .string()
    .max(500, 'Le note non possono superare i 500 caratteri'),
});

// Schema per categoria
export const categorySchema = yup.object({
  name: yup
    .string()
    .required('Il nome della categoria è obbligatorio')
    .min(2, 'Il nome deve essere di almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri'),
  color: yup
    .string()
    .required('Il colore è obbligatorio')
    .matches(/^#[0-9A-F]{6}$/i, 'Il colore deve essere in formato esadecimale'),
  icon: yup
    .string()
    .max(50, 'L\'icona non può superare i 50 caratteri'),
});

// Schema per budget
export const budgetSchema = yup.object({
  categoryId: yup
    .string()
    .required('La categoria è obbligatoria'),
  amount: yup
    .number()
    .required('L\'importo è obbligatorio')
    .positive('L\'importo deve essere positivo')
    .max(999999.99, 'L\'importo non può superare €999,999.99'),
  month: yup
    .number()
    .required('Il mese è obbligatorio')
    .min(1, 'Il mese deve essere tra 1 e 12')
    .max(12, 'Il mese deve essere tra 1 e 12'),
  year: yup
    .number()
    .required('L\'anno è obbligatorio')
    .min(2020, 'L\'anno deve essere almeno 2020')
    .max(2030, 'L\'anno non può superare il 2030'),
  alertThreshold: yup
    .number()
    .min(0, 'La soglia deve essere almeno 0%')
    .max(100, 'La soglia non può superare il 100%'),
  autoRenew: yup.boolean(),
});

// Schema per profilo utente
export const profileSchema = yup.object({
  name: yup
    .string()
    .required('Il nome è obbligatorio')
    .min(2, 'Il nome deve avere almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Il nome può contenere solo lettere e spazi'),
  email: yup
    .string()
    .email('Inserisci un\'email valida')
    .required('L\'email è obbligatoria'),
});

// Schema per cambio password
export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('La password attuale è obbligatoria'),
  newPassword: yup
    .string()
    .required('La nuova password è obbligatoria')
    .min(6, 'La password deve avere almeno 6 caratteri')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La password deve contenere almeno una lettera minuscola, una maiuscola e un numero'
    ),
  confirmNewPassword: yup
    .string()
    .required('La conferma password è obbligatoria')
    .oneOf([yup.ref('newPassword')], 'Le password non coincidono'),
});

const validationSchemas = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createFamilySchema,
  updateFamilySchema,
  inviteMemberSchema,
  expenseSchema,
  incomeSchema,
  categorySchema,
  budgetSchema,
  profileSchema,
  changePasswordSchema,
};

export default validationSchemas; 