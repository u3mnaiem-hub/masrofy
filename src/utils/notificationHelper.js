import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Ensure notifications show banner, sound, and lock-screen alert even when app is open or closed
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.log('Notification handler setup info:', e?.message);
}

const CHANNEL_ID = 'u3mxpns-cc-due-reminders';

export const requestNotificationPermissionsAndSetupChannel = async () => {
  try {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'U3mXpns Credit Card Due Reminders (20th - 25th)',
          description: 'Daily lock-screen & home-screen reminders from the 20th to 25th for Credit Card dues in U3mXpns',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 300, 200, 300],
          lightColor: '#DC2626',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      } catch {}
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.log('Notification permission info:', e?.message);
    return false;
  }
};

/**
 * Schedules Android system notifications for days 20, 21, 22, 23, 24, and 25
 * of the current month (and next month if those dates have already passed),
 * reminding the user on the lock screen & home screen of the exact Credit Card amount due.
 */
export const syncMonthlyCreditCardNotifications = async (balances, currency, formatAmount, isArabic, enabled = true) => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) {
      return { scheduled: 0, granted: false, disabled: true };
    }

    const granted = await requestNotificationPermissionsAndSetupChannel();
    if (!granted) return { scheduled: 0, granted: false };

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonthIdx = now.getMonth(); // 0..11
    const nextMonthIdx = curMonthIdx === 11 ? 0 : curMonthIdx + 1;
    const nextYear = curMonthIdx === 11 ? curYear + 1 : curYear;

    const reminderDays = [20, 21, 22, 23, 24, 25];
    let scheduledCount = 0;

    // 1. Schedule for Current Month (20..25) if there is an amount due this month
    if (balances.totalCcDueThisMonth > 0) {
      for (const day of reminderDays) {
        // Trigger at 12:00 PM (Noon) on each day (20..25)
        const triggerDate = new Date(curYear, curMonthIdx, day, 12, 0, 0);
        if (triggerDate > now) {
          const daysLeftTo25 = Math.max(0, 25 - day);
          const title = isArabic
            ? `💳 U3mXpns • تذكير سداد الكروت (يوم ${day}/${curMonthIdx + 1})`
            : `💳 U3mXpns • Credit Card Due Reminder (${day}/${curMonthIdx + 1})`;

          const detailsParts = [];
          if (balances.ccArDueThisMonth > 0) {
            detailsParts.push(
              isArabic
                ? `البنك العربي: ${formatAmount(balances.ccArDueThisMonth)} ${currency.symbol}`
                : `Arab Bank: ${formatAmount(balances.ccArDueThisMonth)} ${currency.symbol}`
            );
          }
          if (balances.ccCaDueThisMonth > 0) {
            detailsParts.push(
              isArabic
                ? `كريدي أجريكول: ${formatAmount(balances.ccCaDueThisMonth)} ${currency.symbol}`
                : `Crédit Agricole: ${formatAmount(balances.ccCaDueThisMonth)} ${currency.symbol}`
            );
          }
          (balances.customCreditCardsSummary || []).forEach((c) => {
            if (c.dueThisMonth > 0) {
              detailsParts.push(`${c.bankName}: ${formatAmount(c.dueThisMonth)} ${currency.symbol}`);
            }
          });

          const body = isArabic
            ? `المبلغ المستحق هذا الشهر قبل يوم 25 هو ${formatAmount(balances.totalCcDueThisMonth)} ${currency.symbol} (${detailsParts.join(' • ')}) — متبقي ${daysLeftTo25} يوم.`
            : `Amount due this month before the 25th: ${formatAmount(balances.totalCcDueThisMonth)} ${currency.symbol} (${detailsParts.join(' • ')}) — ${daysLeftTo25}d left.`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes
                ? Notifications.SchedulableTriggerInputTypes.DATE
                : 'date',
              date: triggerDate,
            },
          });
          scheduledCount += 1;
        }
      }
    }

    // 2. Also schedule for Next Month (20..25) if there is an amount due next month
    if (balances.totalCcDueNextMonth > 0) {
      for (const day of reminderDays) {
        const triggerDate = new Date(nextYear, nextMonthIdx, day, 12, 0, 0);
        if (triggerDate > now) {
          const daysLeftTo25 = Math.max(0, 25 - day);
          const title = isArabic
            ? `💳 U3mXpns • تذكير سداد الكروت (يوم ${day}/${nextMonthIdx + 1})`
            : `💳 U3mXpns • Credit Card Due Reminder (${day}/${nextMonthIdx + 1})`;

          const detailsParts = [];
          if (balances.ccCaDueNextMonth > 0) {
            detailsParts.push(
              isArabic
                ? `كريدي أجريكول: ${formatAmount(balances.ccCaDueNextMonth)} ${currency.symbol}`
                : `Crédit Agricole: ${formatAmount(balances.ccCaDueNextMonth)} ${currency.symbol}`
            );
          }
          if (balances.ccArDueNextMonth > 0) {
            detailsParts.push(
              isArabic
                ? `البنك العربي: ${formatAmount(balances.ccArDueNextMonth)} ${currency.symbol}`
                : `Arab Bank: ${formatAmount(balances.ccArDueNextMonth)} ${currency.symbol}`
            );
          }
          (balances.customCreditCardsSummary || []).forEach((c) => {
            if (c.dueNextMonth > 0) {
              detailsParts.push(`${c.bankName}: ${formatAmount(c.dueNextMonth)} ${currency.symbol}`);
            }
          });

          const body = isArabic
            ? `المبلغ المستحق قبل يوم 25 هو ${formatAmount(balances.totalCcDueNextMonth)} ${currency.symbol} (${detailsParts.join(' • ')}) — متبقي ${daysLeftTo25} يوم.`
            : `Amount due before the 25th: ${formatAmount(balances.totalCcDueNextMonth)} ${currency.symbol} (${detailsParts.join(' • ')}) — ${daysLeftTo25}d left.`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes
                ? Notifications.SchedulableTriggerInputTypes.DATE
                : 'date',
              date: triggerDate,
            },
          });
          scheduledCount += 1;
        }
      }
    }

    return { scheduled: scheduledCount, granted: true };
  } catch (e) {
    console.log('Schedule notification info:', e?.message);
    return { scheduled: 0, granted: false, error: e?.message };
  }
};

/**
 * Immediate phone notification when a category reaches 80% of its monthly budget or exceeds it.
 */
export const sendBudgetExceededNotification = async (alert, currency, formatAmount, isArabic) => {
  try {
    const granted = await requestNotificationPermissionsAndSetupChannel();
    if (!granted || !alert) return false;

    const isOver = alert.level === 'exceeded';
    const title = isOver
      ? isArabic
        ? `🚨 U3mXpns • تجاوزت ميزانية «${alert.categoryName}»`
        : `🚨 U3mXpns • Budget exceeded: ${alert.categoryName}`
      : isArabic
      ? `⚠️ U3mXpns • قربت من حد ميزانية «${alert.categoryName}»`
      : `⚠️ U3mXpns • Near budget limit: ${alert.categoryName}`;

    const body = isOver
      ? isArabic
        ? `صرفت ${formatAmount(alert.spent)} ${currency.symbol} من ${formatAmount(alert.limit)} ${currency.symbol} — تجاوز بمقدار ${formatAmount(alert.over)} ${currency.symbol}.`
        : `Spent ${formatAmount(alert.spent)} of ${formatAmount(alert.limit)} ${currency.symbol} — over by ${formatAmount(alert.over)} ${currency.symbol}.`
      : isArabic
      ? `صرفت ${formatAmount(alert.spent)} ${currency.symbol} من ${formatAmount(alert.limit)} ${currency.symbol} — متبقي ${formatAmount(alert.remaining)} ${currency.symbol} فقط.`
      : `Spent ${formatAmount(alert.spent)} of ${formatAmount(alert.limit)} ${currency.symbol} — only ${formatAmount(alert.remaining)} ${currency.symbol} left.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: null,
    });
    return true;
  } catch (e) {
    console.log('Budget notification info:', e?.message);
    return false;
  }
};

/**
 * Fires an immediate test notification (or after 3 seconds so user can lock their screen)
 * to verify how the 20th-25th Credit Card reminder looks on the Home Screen & Lock Screen.
 */
export const sendTestCreditCardNotification = async (balances, currency, formatAmount, isArabic) => {
  try {
    const granted = await requestNotificationPermissionsAndSetupChannel();
    if (!granted) return false;

    const title = isArabic
      ? '💳 تذكير U3mXpns (أيام 20 إلى 25 بالشهر)'
      : '💳 U3mXpns Reminder (Days 20–25 of Month)';

    const body = isArabic
      ? `مستحق السداد هذا الشهر قبل يوم 25: ${formatAmount(balances.totalCcDueThisMonth)} ${currency.symbol} (البنك العربي: ${formatAmount(balances.ccArDueThisMonth)} ${currency.symbol}) • والشهر القادم: ${formatAmount(balances.totalCcDueNextMonth)} ${currency.symbol}.`
      : `Due this month before the 25th: ${formatAmount(balances.totalCcDueThisMonth)} ${currency.symbol} (Arab Bank: ${formatAmount(balances.ccArDueThisMonth)} ${currency.symbol}) • Next month: ${formatAmount(balances.totalCcDueNextMonth)} ${currency.symbol}.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: null, // Immediate notification on Home Screen / Lock Screen
    });

    return true;
  } catch (e) {
    console.log('Test notification error:', e?.message);
    return false;
  }
};
