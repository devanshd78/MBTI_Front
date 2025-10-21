// types/mbti.ts
export type MBTIType =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface MBTIResult {
  type: MBTIType;
  title: string;
  description: string;
  traits: string[];
  strengths: string[];
}

/** Extended, product-ready content */
export interface MBTIResultPro extends MBTIResult {
  growth: string[];
  idealEnvironments: string[];
  communicationStyle: string[];
  collaborationTips: string[];
}
