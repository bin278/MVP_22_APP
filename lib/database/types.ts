/**
 * 数据库类型定义
 */

import { PlanType, BillingCycle } from '../payment/payment-config-cn';

/**
 * 用户信息
 */
export interface User {
  id: string;
  email?: string;
  uid?: string;
  fullName?: string;
  user_metadata?: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * 用户订阅信息
 */
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  billing_cycle: BillingCycle;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  subscription_start: string;
  subscription_end: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

/**
 * 加油包类型
 */
export type CreditPackageType = "basic" | "standard" | "premium";

/**
 * 加油包配置
 */
export interface CreditPackageConfig {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  credits: number;
  price: number;
  currency: string;
  validityDays: number;
}

/**
 * 用户加油包记录
 */
export interface UserCreditPackage {
  id: string;
  user_id: string;
  package_id: string;
  package_type: CreditPackageType;
  credits_total: number;
  credits_remaining: number;
  status: 'active' | 'expired' | 'used_up';
  purchase_date: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

/**
 * 支付记录
 */
export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  transaction_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

/**
 * 查询选项
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

/**
 * 查询结果
 */
export interface QueryResult<T> {
  success: boolean;
  data: T[];
  count?: number;
  error?: string;
}

/**
 * 单个结果
 */
export interface SingleResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 修改结果
 */
export interface MutationResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * 用户数据库适配器接口
 */
export interface UserDatabaseAdapter {
  // 用户相关方法
  createUser(userData: Partial<User>): Promise<MutationResult>;
  getUserById(userId: string): Promise<SingleResult<User>>;
  getUserByEmail(email: string): Promise<SingleResult<User>>;
  updateUser(userId: string, updates: Partial<User>): Promise<MutationResult>;

  // 订阅相关方法
  createSubscription(subscriptionData: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<MutationResult>;
  getActiveSubscription(userId: string): Promise<SingleResult<UserSubscription>>;
  getUserSubscriptions(userId: string, options?: QueryOptions): Promise<QueryResult<UserSubscription>>;
  updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<MutationResult>;
  cancelSubscription(subscriptionId: string): Promise<MutationResult>;

  // 支付相关方法
  createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<MutationResult>;
  getUserPayments(userId: string, options?: QueryOptions): Promise<QueryResult<Payment>>;
  updatePayment(paymentId: string, updates: Partial<Payment>): Promise<MutationResult>;
}











