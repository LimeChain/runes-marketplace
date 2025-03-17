import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function setClipboard(text: string) {
  const type = "text/plain";
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  await navigator.clipboard.write(data);
}

export function toHexString(byteArray: number[], reverse?: boolean) {
  const bytes = Array.from(byteArray, (byte: number) => {
      return ('0' + (byte & 0xff).toString(16)).slice(-2)
  })

  if (reverse) {
      bytes.reverse()
  }

  return bytes.join('')
}

export function toHex(value: bigint, reverse?: boolean) {
  const bytes: number[] = []
  let more = true

  while (more) {
      const byte = Number(value & 0xffn)
      value >>= 8n
      if (value === 0n) {
          more = false
      }
      bytes.push(byte)
  }

  return toHexString(bytes, reverse)
}

export function encodeLEB128(value: bigint) {
  const bytes: number[] = []
  let more = true

  while (more) {
      let byte = Number(value & BigInt(0x7f))
      value >>= BigInt(7)
      if (value === BigInt(0)) {
          more = false
      } else {
          byte |= 0x80
      }
      bytes.push(byte)
  }
  return toHexString(bytes)
}

export const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
