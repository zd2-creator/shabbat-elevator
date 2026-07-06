# shabbat-elevator — סקר מעלית שבת (בניין 110)

טופס רישום קומות למעלית שבת + מסך אדמין. עובד על GitHub Pages.

## Backend
מחובר ל-Backend המאוחד של בניין 110 (אותו Apps Script ואותו גיליון של
`bldg110` ו-`bldg110-vote`). הקוד: ריפו `bldg110` → `apps-script/Code.gs`.
הנתונים נשמרים בלשונית **"מעלית"** בגיליון — נוצרת אוטומטית ברישום הראשון.

- ציבורי: `?action=progress` — ספירה לפי קומה בלבד, בלי שמות
- רישום: `POST {action:'submit', floor, apt, name, want}` — בדיקת כפילות בשרת
- אדמין: `POST {action:'getAll', sheet:'מעלית', password}` — סיסמה נבדקת בשרת,
  נעילה ל-15 דקות אחרי 3 ניסיונות שגויים
