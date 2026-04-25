export const ADMIN_NUMBERS = [
  "254748505193",
  "254746620614",
  "254790791647",
  "254758017326",
] as const;

export const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/CBhVSeM4Gc3AwAq0HiJl4l?mode=gi_t";

export const PRIMARY_WHATSAPP = ADMIN_NUMBERS[0];

export const buildWaLink = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

export const formatPhoneDisplay = (intlPhone: string) => {
  // 254748505193 -> +254 748 505 193
  if (intlPhone.length !== 12) return intlPhone;
  return `+${intlPhone.slice(0, 3)} ${intlPhone.slice(3, 6)} ${intlPhone.slice(6, 9)} ${intlPhone.slice(9)}`;
};
