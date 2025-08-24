import { test, expect } from '@playwright/test';

test('Unit4_PC_Docpedia_医師側全画面表示', async ({ page, context }) => {
  const variables: Map<string, any> = new Map();
  variables.set('web.defaults.credentials.username', process.env.USERNAME);
  variables.set('web.defaults.credentials.password', process.env.PASSWORD);
  variables.set('web.defaults.url', 'https://docpedia-qa1.m3.com/');
  // Set viewport size to width 1000 and height 720
  await page.setViewportSize({width: 1000, height: 720});
  // Visit URL assigned to variable "app.url"
  await page.goto(replaceMablVariables(`{{@web.defaults.url}}`, variables));
  // Echo: "ログインID：{{@flow.login_id}}"
  console.log(replaceMablVariables(`ログインID：{{@flow.login_id}}`, variables));
  // Echo: "ログインPW：{{@flow.login_pw}}"
  console.log(replaceMablVariables(`ログインPW：{{@flow.login_pw}}`, variables));
  // Insert value of variable "flow.login_id" into the text field with ID "loginId"
  // These selectors are also valid: '.m3-textbox.opentop__login__panel-textbox'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/form[1]/div[1]/input[1]`).first().type(replaceMablVariables(`{{@flow.login_id}}`, variables));
  // Insert value of variable "flow.login_pw" into the text field with ID "password"
  // These selectors are also valid: '.m3-textbox.opentop__login__panel-textbox'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/form[1]/div[1]/input[2]`).first().type(replaceMablVariables(`{{@flow.login_pw}}`, variables));
  // Click on the "ログイン" button
  // These selectors are also valid: '.m3-button.m3-button--primary.opentop__button'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/form[1]/div[2]/button[1]`).first().click();
  // IF "innerText" of the link "スキップする" to https://www.uact-qa1.m3...gin&pageContext=gp-72219 equals "スキップする"
  // These selectors are also valid: 'getByText('スキップする')'. But we can't guarantee they will be unique
  if (await page.locator(`//html[1]/body[1]/div[2]/div[2]/div[1]/div[1]/div[1]/p[1]/a[1]`).first().innerText()) {
    // Click on the link "スキップする" to https://www.uact-qa1.m3...gin&pageContext=gp-72219
    // These selectors are also valid: 'getByText('スキップする')'. But we can't guarantee they will be unique
    await page.locator(`//html[1]/body[1]/div[2]/div[2]/div[1]/div[1]/div[1]/p[1]/a[1]`).first().click();
    // ELSE
  } else {
    // END
  }
  // Visit URL "https://www.m3.com/"
  await page.goto(replaceMablVariables(`https://www.m3.com/`, variables));
  // IF value of variable "renewal_top_flg" equals "true"
  if (variables.get(`user.renewal_top_flg`) === 'true') {
    // Wait up to 15 seconds until target element matching Class Name attribute is present
    // These selectors are also valid: '.atlas-header__logo'. But we can't guarantee they will be unique
    await page.locator(`//html[1]/body[1]/div[1]/div[1]/h1[1]/a[1]/img[1]`).waitFor({timeout: 15000});
    // Do you need this feature? Create a request in our product portal https://productportal.mabl.com/
    // [EvaluateJavaScript] Step is not supported for Playwright test export
    // ELSE
  } else {
    // END
  }
  // Assert "alt" of the <img> element with class name "atlas-header__logo" equals "m3.com"
  // These selectors are also valid: '.atlas-header__logo'. But we can't guarantee they will be unique
  expect(await page.locator(`//html[1]/body[1]/div[1]/div[1]/h1[1]/a[1]/img[1]`).first().evaluate((el, arg) => el.getAttribute(`alt`) === arg, `m3.com`)).toBeTruthy();
  // Echo: "m3.comにログイン"
  console.log(`m3.comにログイン`);
  // Visit URL assigned to variable "app.url"
  await page.goto(replaceMablVariables(`{{@web.defaults.url}}`, variables));
  // Echo: "#ホーム画面"
  console.log(`#ホーム画面`);
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床" equals "m3.com トップ Docpedia 臨床"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床`);
  // Echo: "Docpedia臨床に遷移"
  console.log(`Docpedia臨床に遷移`);
  // Click on the "この質問に回答する" button
  // These selectors are also valid: '.answer-form-btn.gray-color.icon-none'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/section[1]/div[6]/div[1]/div[2]/button[1]`).first().click();
  // Assert "innerText" of the <h3> element with text "回答投稿" equals "回答投稿"
  // These selectors are also valid: 'getByText('回答投稿')'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/section[1]/section[1]/div[2]/h3[1]`).first()).toHaveText(`回答投稿`);
  // Click on the <div> element with text "×"
  // These selectors are also valid: '.close'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/section[1]/section[1]/div[2]/div[1]/div[1]/div[1]`).first().click();
  // Click on the <li> element with text "新着順"
  // These selectors are also valid: 'getByText('新着順')'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[2]/div[1]/div[2]/ul[1]/li[2]`).first().click();
  // Assert "pathname" of current URL equals "/"
  expect(await page.evaluate(arg => window.location.pathname === arg, `/`)).toBeTruthy();
  // Click on the "この質問に回答する" button
  // These selectors are also valid: '.answer-form-btn.gray-color.icon-none'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/section[1]/div[5]/div[1]/div[2]/button[1]`).first().click();
  // Assert "innerText" of the <h3> element with text "回答投稿" equals "回答投稿"
  // These selectors are also valid: 'getByText('回答投稿')'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/section[1]/section[1]/div[2]/h3[1]`).first()).toHaveText(`回答投稿`);
  // Click on the <div> element with text "×"
  // These selectors are also valid: '.close'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/section[1]/section[1]/div[2]/div[1]/div[1]/div[1]`).first().click();
  // Click on the <li> element with text "おすすめ順"
  // These selectors are also valid: 'getByText('おすすめ順')'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[2]/div[1]/div[2]/ul[1]/li[1]`).first().click();
  // Assert "pathname" of current URL equals "/"
  expect(await page.evaluate(arg => window.location.pathname === arg, `/`)).toBeTruthy();
  // Echo: "#マイページお知らせ画面"
  console.log(`#マイページお知らせ画面`);
  // Visit URL "https://docpedia-qa1.m3.com/mypage/notifications"
  await page.goto(replaceMablVariables(`https://docpedia-qa1.m3.com/mypage/notifications`, variables));
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 マイページ お知らせ" equals "m3.com トップ Docpedia 臨床 マイページ お知らせ"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 マイページ お知らせ`);
  // Echo: "Docpedia臨床マイページお知らせに遷移"
  console.log(`Docpedia臨床マイページお知らせに遷移`);
  // Echo: "#QA詳細画面"
  console.log(`#QA詳細画面`);
  // Click on the <h3> element with text "あなたの質問に回答がつきました。"
  // These selectors are also valid: 'getByText('あなたの質問に回答がつきました。')'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[4]/dl[1]/a[1]/dd[1]/h3[1]`).first().click();
  // Click on first <dd> element matching css query "#app > div > div > div.notification-page.pc > dl > a > dd"
  await page.locator(`#app > div > div > div.notification-page.pc > dl > a > dd`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 Q&A" equals "m3.com トップ Docpedia 臨床 Q&A"
  // These selectors are also valid: '.breadcrumb.m3-clearfix'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 Q&A`);
  // Echo: "#マイページ回答募集中一覧"
  console.log(`#マイページ回答募集中一覧`);
  // Click on the <div> element with text "回答 する"
  // These selectors are also valid: '.service-navi-question-list'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[3]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 マイページ 回答募集中の質問" equals "m3.com トップ Docpedia 臨床 マイページ 回答募集中の質問"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 マイページ 回答募集中の質問`);
  // Click on the link "この質問に回答する"
  // These selectors are also valid: '.answer-form-btn'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[2]/div[1]/div[2]/a[1]`).first().click();
  // Assert "innerText" of the <h1> element with text "質問回答" equals "質問回答"
  // These selectors are also valid: 'getByText('質問回答')'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/div[1]/div[1]/h1[1]`).first()).toHaveText(`質問回答`);
  // Click on the <div> element with text "×"
  // These selectors are also valid: '.close'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/div[1]/div[1]/div[1]`).first().click();
  // Echo: "#マイページ自分の質問"
  console.log(`#マイページ自分の質問`);
  // Click on the <li> element with text "自分の 質問"
  // These selectors are also valid: 'getByText('自分の 質問')'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/ul[1]/li[2]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 マイページ 自分の質問" equals "m3.com トップ Docpedia 臨床 マイページ 自分の質問"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 マイページ 自分の質問`);
  // Click on the <div> element with text "ステータスについて"
  // These selectors are also valid: '.about-status'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/div[2]/div[1]/div[2]`).first().click();
  // Assert "innerText" of the <h3> element with text "現在のステータスについて" equals "現在のステータスについて"
  // These selectors are also valid: 'getByText('現在のステータスについて')'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/h3[1]`).first()).toHaveText(`現在のステータスについて`);
  // Click on the <div> element with text "×"
  // These selectors are also valid: '.close-modal'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/div[2]`).first().click();
  // Click on the <span> element with text "公開済み"
  // These selectors are also valid: '.item-status__name'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[2]/div[2]/ul[1]/li[2]/div[1]/div[3]/div[1]/span[2]`).first().click();
  // Click on the link "公開ページへ" to https://docpedia-qa1.m3.com/detail/11879
  // These selectors are also valid: '.item-link.pc'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/div[1]/div[3]/div[1]/a[1]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 Q&A" equals "m3.com トップ Docpedia 臨床 Q&A"
  // These selectors are also valid: '.breadcrumb.m3-clearfix'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 Q&A`);
  // Echo: "#マイページ自分の回答"
  console.log(`#マイページ自分の回答`);
  // Click on the <div> element with text "回答 する"
  // These selectors are also valid: '.service-navi-question-list'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[3]`).first().click();
  // Click on the <li> element with text "自分の 回答"
  // These selectors are also valid: 'getByText('自分の 回答')'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/ul[1]/li[3]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 マイページ 自分の回答" equals "m3.com トップ Docpedia 臨床 マイページ 自分の回答"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 マイページ 自分の回答`);
  // Click on the <div> element with text "ステータスについて"
  // These selectors are also valid: '.about-status'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/div[2]/div[1]/div[2]`).first().click();
  // Assert "innerText" of the <h3> element with text "現在のステータスについて" equals "現在のステータスについて"
  // These selectors are also valid: 'getByText('現在のステータスについて')'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/h3[1]`).first()).toHaveText(`現在のステータスについて`);
  // Click on the <div> element with text "×"
  // These selectors are also valid: '.close-modal'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/div[2]`).first().click();
  // Click on the <span> element with text "公開済み"
  // These selectors are also valid: '.item-status__name'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[2]/div[2]/ul[1]/li[2]/div[1]/div[3]/div[1]/span[2]`).first().click();
  // Click on the link "公開ページへ" to https://docpedia-qa1.m3.com/detail/11345
  // These selectors are also valid: '.item-link.pc'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/section[1]/div[2]/div[1]/div[3]/div[1]/a[1]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 Q&A" equals "m3.com トップ Docpedia 臨床 Q&A"
  // These selectors are also valid: '.breadcrumb.m3-clearfix'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 Q&A`);
  // Echo: "#プロフィール編集画面"
  console.log(`#プロフィール編集画面`);
  // Click on the <div> element with text "回答 する"
  // These selectors are also valid: '.service-navi-question-list'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[3]`).first().click();
  // Click on the "プロフィール編集" button
  // These selectors are also valid: '.change-profile-btn.small-size.docpedia-color.icon-none.pc'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[2]/div[2]/a[1]/button[1]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 マイページ" equals "m3.com トップ Docpedia 臨床 マイページ"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 マイページ`);
  // Echo: "#他人のプロフィール画面"
  console.log(`#他人のプロフィール画面`);
  // Visit URL "{{@app.url}}detail/11177"
  await page.goto(replaceMablVariables(`{{@web.defaults.url}}detail/11177`, variables));
  // Click on the link "田仲 俊彦 先生" to https://docpedia-qa1.m3...2GJ32UI26SO44EEN44111111
  // These selectors are also valid: 'getByText('田仲 俊彦 先生')'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[4]/div[1]/div[2]/div[1]/div[1]/h3[1]/span[1]/a[1]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 田仲 俊彦 先生のプロフィール" equals "m3.com トップ Docpedia 臨床 田仲 俊彦 先生のプロフィール"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 田仲 俊彦 先生のプロフィール`);
  // Echo: "#検索結果画面"
  console.log(`#検索結果画面`);
  // Click on the "薬剤や症例に関するQ＆Aを調べる" text field
  // These selectors are also valid: '.service-navi-search-text'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[4]/div[1]/div[1]/div[1]/div[1]/div[2]/div[2]/form[1]/input[1]`).first().click();
  // Enter "test" in the "薬剤や症例に関するQ＆Aを調べる" text field
  // These selectors are also valid: '.service-navi-search-text'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[4]/div[1]/div[1]/div[1]/div[1]/div[2]/div[2]/form[1]/input[1]`).first().type(`test`);
  // Click on the button with ID "search_submit"
  // These selectors are also valid: 'id=search_submit'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[4]/div[1]/div[1]/div[1]/div[1]/div[2]/div[2]/form[1]/input[2]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 検索結果" equals "m3.com トップ Docpedia 臨床 検索結果"
  // These selectors are also valid: '.breadcrumb.m3-clearfix'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 検索結果`);
  // Echo: "#特集ページ"
  console.log(`#特集ページ`);
  // Visit URL "{{@app.url}}features"
  await page.goto(replaceMablVariables(`{{@web.defaults.url}}features`, variables));
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 特集一覧" equals "m3.com トップ Docpedia 臨床 特集一覧"
  // These selectors are also valid: '.breadcrumb.m3-clearfix'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 特集一覧`);
  // Echo: "#特集詳細"
  console.log(`#特集詳細`);
  // Click on the <h3> element with text "システムコード紐付けなしシステムコード紐付けなしシステムコード紐付けなしシステム"
  // These selectors are also valid: '.heading-3.pc'. But we can't guarantee they will be unique
  await page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/a[1]/h3[1]`).first().click();
  // Assert "innerText" of the <div> element with text "m3.com トップ Docpedia 臨床 特集一覧 特集詳細" equals "m3.com トップ Docpedia 臨床 特集一覧 特集詳細"
  // These selectors are also valid: '.breadcrumb.m3-clearfix.bread-crumb'. But we can't guarantee they will be unique
  await expect(page.locator(`//html[1]/body[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]`).first()).toHaveText(`m3.com トップ Docpedia 臨床 特集一覧 特集詳細`);
});

function replaceMablVariables(value: string, variables: Map<string, any>) {
  const regex = /{{@?([^{}]+)}}/g;
  return value.replace(regex, (_match, p1) => {
    const variable = variables.get(p1);
    if (variable) {
      return variable;
    }
    return p1;
  });
}