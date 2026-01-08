/**
 * Supabase 用户数据库适配器
 *
 * 实现 UserDatabaseAdapter 接口,用于国际版环境
 */

import { getSupabaseAdmin } from '../supabase';
import type {
  UserDatabaseAdapter,
  User,
  UserSubscription,
  Payment,
  QueryOptions,
  QueryResult,
  SingleResult,
  MutationResult,
} from '../types';

/**
 * Supabase 用户数据库适配器实现
 */
export class SupabaseUserAdapter implements UserDatabaseAdapter {
  private get client() {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      throw new Error('Supabase client not initialized');
    }
    return adminClient;
  }

  /**
   * 根据 ID 获取用户
   */
  async getUserById(userId: string): Promise<SingleResult<User>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在
          return { data: null, error: null };
        }
        throw error;
      }

      if (!data) {
        return { data: null, error: null };
      }

      return {
        data: {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          subscription_plan: data.subscription_plan || 'free',
          subscription_status: data.subscription_status || 'active',
          region: 'international',
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<SingleResult<User>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在
          return { data: null, error: null };
        }
        throw error;
      }

      if (!data) {
        return { data: null, error: null };
      }

      return {
        data: {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          subscription_plan: data.subscription_plan || 'free',
          subscription_status: data.subscription_status || 'active',
          region: 'international',
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * 创建用户
   */
  async createUser(
    user: Omit<User, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MutationResult> {
    try {
      const now = new Date().toISOString();

      const newUser = {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        subscription_plan: user.subscription_plan || 'free',
        subscription_status: user.subscription_status || 'active',
        region: 'international',
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await this.client
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * 更新用户
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<MutationResult> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.subscription_plan !== undefined) updateData.subscription_plan = updates.subscription_plan;
      if (updates.subscription_status !== undefined) updateData.subscription_status = updates.subscription_status;

      const { error } = await this.client
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      return { success: true, id: userId };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * 获取用户活跃订阅
   */
  async getActiveSubscription(userId: string): Promise<SingleResult<UserSubscription>> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await this.client
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('subscription_end', now)
        .order('subscription_end', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有活跃订阅
          return { data: null, error: null };
        }
        throw error;
      }

      if (!data) {
        return { data: null, error: null };
      }

      return {
        data: {
          id: data.id,
          user_id: data.user_id,
          subscription_end: data.subscription_end,
          status: data.status,
          plan_type: data.plan_type,
          currency: data.currency,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * 创建订阅
   */
  async createSubscription(
    subscription: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MutationResult> {
    try {
      const now = new Date().toISOString();

      const newSubscription = {
        ...subscription,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await this.client
        .from('user_subscriptions')
        .insert(newSubscription)
        .select()
        .single();

      if (error) throw error;

      // 同时更新用户的订阅状态
      await this.updateUser(subscription.user_id, {
        subscription_plan: subscription.plan_type,
        subscription_status: subscription.status,
      });

      return { success: true, id: data.id };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * 更新订阅
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<UserSubscription>
  ): Promise<MutationResult> {
    try {
      // 先获取订阅信息
      const { data: existing, error: fetchError } = await this.client
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;
      if (!existing) {
        return { success: false, error: new Error('Subscription not found') };
      }

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // 移除不应该更新的字段
      delete updateData.id;
      delete updateData.user_id;
      delete updateData.created_at;

      const { error } = await this.client
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId);

      if (error) throw error;

      // 如果状态或计划类型更改,同时更新用户资料
      if (updates.status || updates.plan_type) {
        const userUpdates: any = {};
        if (updates.status) userUpdates.subscription_status = updates.status;
        if (updates.plan_type) userUpdates.subscription_plan = updates.plan_type;

        await this.updateUser(existing.user_id, userUpdates);
      }

      return { success: true, id: subscriptionId };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * 获取用户订阅列表
   */
  async getUserSubscriptions(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<UserSubscription>> {
    try {
      const { limit = 20, offset = 0 } = options;

      let query = this.client
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        count: data?.length || 0,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(subscriptionId: string): Promise<MutationResult> {
    try {
      const { error } = await this.client
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      return { success: true, id: subscriptionId };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * 获取支付历史
   */
  async getUserPayments(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Payment>> {
    try {
      const { limit = 20, offset = 0 } = options;

      let query = this.client
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        count: data?.length || 0,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * 创建支付记录
   */
  async createPayment(
    payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MutationResult> {
    try {
      const now = new Date().toISOString();

      const newPayment = {
        ...payment,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await this.client
        .from('payments')
        .insert(newPayment)
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * 更新支付记录
   */
  async updatePayment(
    paymentId: string,
    updates: Partial<Payment>
  ): Promise<MutationResult> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // 移除不应该更新的字段
      delete updateData.id;
      delete updateData.user_id;
      delete updateData.created_at;

      const { error } = await this.client
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      return { success: true, id: paymentId };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * 获取单个支付记录
   */
  async getPaymentById(paymentId: string): Promise<SingleResult<Payment>> {
    try {
      const { data, error } = await this.client
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在
          return { data: null, error: null };
        }
        throw error;
      }

      if (!data) {
        return { data: null, error: null };
      }

      return {
        data: {
          id: data.id,
          user_id: data.user_id,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          payment_method: data.payment_method,
          transaction_id: data.transaction_id,
          subscription_id: data.subscription_id,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
          completed_at: data.completed_at,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  /**
   * 删除支付记录
   */
  async deletePayment(paymentId: string): Promise<MutationResult> {
    try {
      const { error } = await this.client
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      return { success: true, id: paymentId };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }
}
