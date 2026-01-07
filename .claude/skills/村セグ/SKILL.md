---
name: 村セグ（村田セグメント）
description: 関連ワードはmurasegID。このスキルはABテストのグルーピングに使われます。test群とctrl群のユーザーIDを求めたい時にこの実行フローが呼び出されます。
---

# 村セグ 

## 概要
正式名称は村田セグメント。ABテストのために会員を複数グループに無作為分割する際に使う数式。0~99の値が出る。
効果測定したいプロジェクトID(muraSegId)とユーザーID(systemCode)を用いて下の**計算式**から値を出し、その値によってグルーピングする。
基本的には値により下のようにちょうど半分に分類することが多い。  
0~49:test群. 
50~99:ctrl群. 

**計算式**: 

 (int)(Math.sqrt((double)systemCode * (double)muraSegId * 1001001001.0) % 100);

## スキル実行フロー
計算の際はsystemCode(0埋めが含まれる10桁の数字)とmurasegIDを要求してください。
user_listフォルダ内にあるユーザーのsystemCodeを用いても構いません。
値を出すスクリプト自体はreference/muraseg.pyにあります。