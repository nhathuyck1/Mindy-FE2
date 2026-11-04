import { test, expect } from '@playwright/test';
import { mockMentorWorkspace } from '../../../tests/e2e/mentor-workspace-fixtures';
import { mentorIds } from '../../../tests/e2e/mentor-fixtures';

test('audit live mentor login and read-only workspace', async ({page}, info) => {
  test.setTimeout(90_000);
  test.skip(!process.env.MINDY_QA_PASSWORD, 'Requires user-provided QA credentials');
  await page.goto('/admin/login?returnTo=%2Fmentor');
  await page.getByLabel('Email', {exact:true}).fill(process.env.MINDY_QA_EMAIL!);
  await page.getByLabel('Mật khẩu', {exact:true}).fill(process.env.MINDY_QA_PASSWORD!);
  const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/v1/auth/login'));
  await page.getByRole('button', {name:'Đăng nhập',exact:true}).click();
  const response = await responsePromise;
  console.log('LIVE_LOGIN_STATUS',response.status());
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/mentor$/);
  await expect(page.getByRole('heading',{name:'Lịch dạy của bạn'})).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('button',{name:'Mở menu Mentor',exact:true}).click();
  await page.getByRole('link',{name:'Lớp của tôi',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Lớp của tôi',exact:true})).toBeVisible();
  const course = page.getByRole('link').filter({hasText:'HTML-CSS-101-10S-20261013'});
  await expect(course).toBeVisible();
  await page.screenshot({path:`docs/qa/mentor-2026-11-04/live-classes-${info.project.name}.png`,fullPage:true});
  await course.click();
  await expect(page.getByRole('button',{name:'Chương',exact:true})).toBeVisible();
  for (const tab of ['Học viên','Chuyên cần','Tiến độ','Buổi học','Bài tập']) {
    await page.getByRole('button',{name:tab,exact:true}).click();
    await expect(page.getByRole('button',{name:tab,exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('status',{name:'Đang tải dữ liệu…',exact:true})).toHaveCount(0,{timeout:20000});
    if (tab === 'Học viên') await expect(page.getByRole('button',{name:'Làm mới',exact:true})).toBeEnabled();
    if (tab === 'Bài tập') await expect(page.getByText('Đang tải bài tập…', {exact:true})).toHaveCount(0, {timeout:20000});
    await page.screenshot({path:`docs/qa/mentor-2026-11-04/live-tab-${['Học viên','Chuyên cần','Tiến độ','Buổi học','Bài tập'].indexOf(tab)}-${info.project.name}.png`,fullPage:true});
    const alerts = await page.getByRole('alert').allTextContents();
    console.log('LIVE_TAB',tab,JSON.stringify(alerts.filter(Boolean)));
  }
  await page.getByRole('button',{name:'Xóa lọc',exact:true}).click();
  await expect(page).toHaveURL(/\/mentor\/classes\/[a-f0-9-]+$/);
  await expect(page.getByRole('button',{name:'Chương',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:`docs/qa/mentor-2026-11-04/live-clear-filter-${info.project.name}.png`,fullPage:true});
  console.log('QA-01 reproduced live: clearing assignment filters switches to the chapter tab');
  await page.getByRole('link',{name:'← Lớp của tôi',exact:true}).click();
  await page.getByLabel('Phân công',{exact:true}).selectOption('PRIMARY');
  await expect(page.getByLabel('Phân công',{exact:true})).toHaveValue('PRIMARY');
  await page.getByRole('link').filter({hasText:'HTML-CSS-101-10S-20261013'}).click();
  await page.getByRole('link',{name:'← Lớp của tôi',exact:true}).click();
  await expect(page.getByLabel('Phân công',{exact:true})).toHaveValue('ANY');
  console.log('QA-03 reproduced live: PRIMARY filter resets to ANY');
});

test('QA-02 unchanged effective meeting URL is sent as a session override', async ({page}) => {
  const {calls} = await mockMentorWorkspace(page);
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await page.getByRole('button',{name:'Sửa link buổi học',exact:true}).click();
  await expect(page.getByLabel('Link học trực tuyến')).toHaveValue('https://meet.example.test/old');
  await page.getByRole('button',{name:'Lưu link buổi học',exact:true}).click();
  await expect.poll(() => calls.filter(c => c.path.endsWith('/meeting-url')).length).toBe(1);
  const call = calls.find(c => c.path.endsWith('/meeting-url'));
  expect(call?.body?.meetingUrl).toBe('https://meet.example.test/old');
  console.log('QA-02 unchanged form sends explicit URL:',JSON.stringify(call?.body));
});

test('QA-03 class assignment filter is lost after opening a class and returning', async ({page}, info) => {
  await mockMentorWorkspace(page);
  await page.goto('/mentor/classes');
  await page.getByLabel('Phân công',{exact:true}).selectOption('SUBSTITUTE');
  await expect(page.getByLabel('Phân công',{exact:true})).toHaveValue('SUBSTITUTE');
  await page.getByRole('link',{name:/Lớp JavaScript tháng 10/}).click();
  await page.getByRole('link',{name:'← Lớp của tôi',exact:true}).click();
  await expect(page.getByLabel('Phân công',{exact:true})).toHaveValue('ANY');
  await page.screenshot({path:`docs/qa/mentor-2026-11-04/class-filter-reset-${info.project.name}.png`,fullPage:true});
  console.log('QA-03 filter changed SUBSTITUTE -> ANY after return');
});

test('QA-01 reproduce clearing assignment filters leaving the assignments tab', async ({page}, info) => {
  await mockMentorWorkspace(page);
  await page.goto(`/mentor/classes/${mentorIds.class}?tab=assignments&type=QUIZ`);
  await expect(page.getByRole('button',{name:'Bài tập',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Xóa lọc',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/mentor/classes/${mentorIds.class}$`));
  await expect(page.getByRole('button',{name:'Chương',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:`docs/qa/mentor-2026-11-04/assignment-clear-${info.project.name}.png`,fullPage:true});
  console.log('QA-01 reproduced with fixtures: assignment tab loses selection');
});
