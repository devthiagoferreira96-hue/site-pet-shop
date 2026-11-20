/**
 * Ícones animados do lucide-animated (MIT — https://lucide-animated.com).
 * Os arquivos em src/components/icons/ são baixados com: npm run icones
 * Para adicionar um ícone: inclua o nome em icones-lista.json, rode npm run icones e importe aqui.
 */
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { BoneIcon } from "@/components/icons/bone";
import { CalendarDaysIcon } from "@/components/icons/calendar-days";
import { CartIcon } from "@/components/icons/cart";
import { CheckIcon } from "@/components/icons/check";
import { CircleCheckIcon } from "@/components/icons/circle-check";
import { ClockIcon } from "@/components/icons/clock";
import { CreditCardIcon } from "@/components/icons/credit-card";
import { DeleteIcon } from "@/components/icons/delete";
import { HeartPulseIcon } from "@/components/icons/heart-pulse";
import { LogoutIcon } from "@/components/icons/logout";
import { MapPinIcon } from "@/components/icons/map-pin";
import { MessageCircleIcon } from "@/components/icons/message-circle";
import { PhoneIcon } from "@/components/icons/phone";
import { PlusIcon } from "@/components/icons/plus";
import { SearchIcon } from "@/components/icons/search";
import { ShieldCheckIcon } from "@/components/icons/shield-check";
import { SparklesIcon } from "@/components/icons/sparkles";
import { UploadIcon } from "@/components/icons/upload";

export const ICONES = {
  seta: ArrowRightIcon, osso: BoneIcon, calendario: CalendarDaysIcon, carrinho: CartIcon, check: CheckIcon,
  sucesso: CircleCheckIcon, relogio: ClockIcon, cartao: CreditCardIcon, lixeira: DeleteIcon, coracao: HeartPulseIcon,
  sair: LogoutIcon, local: MapPinIcon, mensagem: MessageCircleIcon, telefone: PhoneIcon, mais: PlusIcon,
  busca: SearchIcon, escudo: ShieldCheckIcon, brilho: SparklesIcon, enviar: UploadIcon,
} as const;

export type NomeIconeAnimado = keyof typeof ICONES;
