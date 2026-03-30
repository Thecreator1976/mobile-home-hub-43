export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4
  feedback: string;
  suggestions: string[];
}

export async function validatePassword(password: string): Promise<PasswordValidationResult> {
  if (!password) {
    return {
      isValid: false,
      score: 0,
      feedback: 'Password is required',
      suggestions: []
    };
  }

  // Basic requirements
  if (password.length < 8) {
    return {
      isValid: false,
      score: 0,
      feedback: 'Password must be at least 8 characters',
      suggestions: ['Make your password longer']
    };
  }

  // Check for common patterns
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'admin', 'welcome',
    'letmein', 'monkey', 'dragon', 'master', 'login'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      isValid: false,
      score: 0,
      feedback: 'This password is too common',
      suggestions: ['Use a more unique password']
    };
  }

  // Use zxcvbn for advanced checking (dynamically loaded)
  const { default: zxcvbn } = await import('zxcvbn');
  const result = zxcvbn(password);
  
  return {
    isValid: result.score >= 3, // Require score 3 or higher
    score: result.score,
    feedback: result.feedback.warning || '',
    suggestions: result.feedback.suggestions || []
  };
}

// Check against Have I Been Pwned API using k-Anonymity
export async function checkPasswordAgainstBreaches(password: string): Promise<boolean> {
  try {
    // Hash the password using SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hashPrefix = hashHex.substring(0, 5).toUpperCase();
    const hashSuffix = hashHex.substring(5).toUpperCase();

    // Check with HIBP API (uses k-Anonymity - only sends first 5 chars of hash)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
      headers: {
        'Add-Padding': 'true' // Adds padding to responses for enhanced privacy
      }
    });
    
    if (!response.ok) {
      console.warn('HIBP API request failed:', response.status);
      return false; // Fail safe - allow if API fails
    }
    
    const dataText = await response.text();
    
    // Check if our hash suffix appears in the results
    return dataText.includes(hashSuffix);
  } catch (error) {
    console.error('Error checking password breaches:', error);
    return false; // Fail safe - allow if API fails
  }
}

// Get strength label for score
export function getStrengthLabel(score: number): string {
  switch (score) {
    case 0: return 'Very Weak';
    case 1: return 'Weak';
    case 2: return 'Fair';
    case 3: return 'Strong';
    case 4: return 'Very Strong';
    default: return 'Unknown';
  }
}

// Get color class for score
export function getStrengthColor(score: number): string {
  switch (score) {
    case 0: return 'bg-destructive';
    case 1: return 'bg-destructive';
    case 2: return 'bg-yellow-500';
    case 3: return 'bg-green-500';
    case 4: return 'bg-green-600';
    default: return 'bg-muted';
  }
}
