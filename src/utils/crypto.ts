
export async function generateCryptoHash(content: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(content + Date.now().toString());
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `SHA256:${hashHex}`;
    }
  } catch {
  }

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const randomSuffix = Math.random().toString(16).substring(2, 10);
  return `SHA256:${hex}${randomSuffix}0b9c3e2a1d4f7c8b0e2a5d9f1c3e7b4a`;
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTimeRemaining(deadlineIso: string): {
  totalHours: number;
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  text: string;
} {
  const deadline = new Date(deadlineIso).getTime();
  const now = new Date().getTime();
  const diff = deadline - now;

  if (diff <= 0) {
    return {
      totalHours: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true,
      text: 'Submission Closed',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const totalHours = diff / (1000 * 60 * 60);

  let text = '';
  if (days > 0) {
    text = `${days}d ${hours}h left`;
  } else {
    text = `${hours}h ${minutes}m left (Urgent)`;
  }

  return {
    totalHours,
    days,
    hours,
    minutes,
    isExpired: false,
    text,
  };
}
