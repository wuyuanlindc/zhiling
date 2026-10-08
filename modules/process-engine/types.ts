/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Left sidebar navigation items
export enum MenuItem {
  // 模板与流程引擎管理 -> 二级菜单：模板与流程引擎配置、实例管理
  ProcessEngineManage = 'process_engine_manage',
  ProcessInstanceManage = 'process_instance_manage',
  MessageCenter = 'message_center'
}

// System types
export type SystemMode = 'quotation_system' | 'contract_system';

// Operational log interface
export interface OperationLog {
  id: number;
  operationType: string;
  operator: string;
  operatorPinyin: string;
  department: string;
  content: string;
  ip: string;
  result: '成功' | '失败';
  createdAt: string;
}

