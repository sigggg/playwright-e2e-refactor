/**
 * QA環境用テストアカウント
 *
 * @description
 * - QA環境専用のため本番環境には影響しない
 * - Git管理対象（.envではなくソースコードとして管理）
 * - 型安全性が確保され、IDEの補完が有効
 *
 * @security
 * - これらはQA環境専用の共有テストアカウント
 * - 本番環境へのアクセス権限は持たない
 * - 定期的なパスワード変更は不要（固定値）
 */

/**
 * M3.com アカウント情報のインターフェース
 */
export interface M3Account {
  name: string
  username: string
  password: string
  description: string
}

/**
 * Backroom管理画面アカウント情報のインターフェース
 */
export interface BackroomAccount {
  name: string
  loginId: string
  loginPw: string
  description: string
}

/**
 * M3 Internal管理画面アカウント情報のインターフェース
 */
export interface M3InternalAccount {
  name: string
  username: string
  password: string
  description: string
}

/**
 * PC版 M3.com 標準アカウント
 */
export const PC_ACCOUNT: M3Account = {
  name: 'PC版標準アカウント',
  username: 'unit4_auto_test_001',
  password: 'test1234',
  description: 'PC版テスト用の標準ログインアカウント'
}

/**
 * SP版 M3.com 標準アカウント
 */
export const SP_ACCOUNT: M3Account = {
  name: 'SP版標準アカウント',
  username: 'unit4_auto_test_001',
  password: 'test1234',
  description: 'SP版テスト用の標準ログインアカウント'
}

/**
 * Backroom管理画面アカウント（記事作成・管理用）
 */
export const BACKROOM_ACCOUNT: BackroomAccount = {
  name: 'Backroom管理画面アカウント',
  loginId: 'U4QA_test001',
  loginPw: 'U4QA_test001',
  description: 'Backroom管理画面での記事作成・管理用アカウント'
}

/**
 * M3 Internal管理画面アカウント
 */
export const M3_INTERNAL_ACCOUNT: M3InternalAccount = {
  name: 'M3 Internal管理画面アカウント',
  username: 'unit4-qa-user',
  password: 'u4QA!1234',
  description: 'M3 Internal管理画面（qa-a.m3internal.com）でのコミュニティ管理用アカウント'
}

/**
 * 全テストアカウントをまとめたオブジェクト
 *
 * @example
 * ```typescript
 * import { TEST_ACCOUNTS } from './data/test-accounts'
 *
 * // PC版テストでの使用
 * await loginPage.login(TEST_ACCOUNTS.pc.username, TEST_ACCOUNTS.pc.password)
 *
 * // SP版テストでの使用
 * await spLoginPage.login(TEST_ACCOUNTS.sp.username, TEST_ACCOUNTS.sp.password)
 *
 * // Backroom管理画面テストでの使用
 * await backroomLogin.performFullLogin({
 *   cognitoUsername: TEST_ACCOUNTS.backroom.loginId,
 *   cognitoPassword: TEST_ACCOUNTS.backroom.loginPw,
 *   ldapUserId: TEST_ACCOUNTS.backroom.loginId,
 *   ldapPassword: TEST_ACCOUNTS.backroom.loginPw
 * })
 *
 * // M3 Internal管理画面テストでの使用
 * await m3InternalLogin.performLogin({
 *   username: TEST_ACCOUNTS.m3Internal.username,
 *   password: TEST_ACCOUNTS.m3Internal.password
 * })
 * ```
 */
export const TEST_ACCOUNTS = {
  pc: PC_ACCOUNT,
  sp: SP_ACCOUNT,
  backroom: BACKROOM_ACCOUNT,
  m3Internal: M3_INTERNAL_ACCOUNT
}
