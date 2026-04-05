export const EVENTS = [
  // JAN
  { date: "2026-01-01", name: "New Year's Day", cat: "International", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events"], priority: 3, adLeadDays: 20, note: "NYE party promos, brunch buffet, venue showcase for wedding bookings" },
  { date: "2026-01-13", name: "Lohri", cat: "Hindu Festival", actions: ["story","ad","host"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","decor"], priority: 3, adLeadDays: 20, note: "Bonfire party, Punjabi themed event — pre-wedding season content" },
  { date: "2026-01-14", name: "Makar Sankranti", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Festive greeting story" },
  { date: "2026-01-26", name: "Republic Day", cat: "National", actions: ["story"], pages: ["ambria_in","manaktala","pushpanjali","exotica"], priority: 1, note: "Tricolor themed story" },
  // FEB
  { date: "2026-02-05", name: "Basant Panchami", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in","decor"], priority: 1, note: "Yellow-themed story, spring decor inspiration" },
  { date: "2026-02-14", name: "Valentine's Day", cat: "International", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine"], priority: 3, adLeadDays: 20, note: "Couple dinner, candlelight buffet, love-themed decor, Valentine's party at venues" },
  { date: "2026-02-26", name: "Maha Shivaratri", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Festival greeting" },
  // MAR
  { date: "2026-03-08", name: "International Women's Day", cat: "International", actions: ["story","reel"], pages: ["ambria_in","restro"], priority: 2, note: "Team spotlight reel, women in events" },
  { date: "2026-03-14", name: "Holi", cat: "Hindu Festival", actions: ["story","ad","host","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","restro","decor"], priority: 3, adLeadDays: 20, note: "Holi party — rain dance, colors, DJ, food stalls. Start ads early March" },
  { date: "2026-03-29", name: "Eid ul-Fitr", cat: "Muslim Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, note: "Eid Mubarak story, special feast buffet" },
  { date: "2026-03-31", name: "FY End Booking Push", cat: "Business", actions: ["ad"], pages: ["manaktala","pushpanjali","exotica"], priority: 3, adLeadDays: 30, note: "\"Book before March 31\" — corporate events & early wedding bookings" },
  // APR
  { date: "2026-04-02", name: "Ram Navami", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Festive greeting" },
  { date: "2026-04-13", name: "Baisakhi", cat: "Sikh Festival", actions: ["story","ad","host"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","cuisine"], priority: 2, adLeadDays: 15, note: "Baisakhi celebration, Punjabi food fest, bhangra night" },
  { date: "2026-04-20", name: "Easter", cat: "Christian", actions: ["story","restaurant"], pages: ["ambria_in","restro"], priority: 1, note: "Easter brunch, pastel themed content" },
  { date: "2026-04-15", name: "Wedding Season Ad Push", cat: "Business", actions: ["ad","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","decor","events","cuisine"], priority: 3, adLeadDays: 30, note: "Heavy wedding venue ads — real wedding reels, testimonials, venue tours" },
  // MAY
  { date: "2026-05-11", name: "Mother's Day", cat: "International", actions: ["story","ad","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, adLeadDays: 15, note: "Mother's Day brunch/lunch buffet, family celebration" },
  { date: "2026-05-15", name: "Summer Pool Party Launch", cat: "Seasonal", actions: ["story","ad","host","reel"], pages: ["restro","exotica","events"], priority: 3, adLeadDays: 20, note: "Pool party — DJ, BBQ, cocktails. Start ads early May. Restro farm pool" },
  // JUN
  { date: "2026-06-05", name: "World Environment Day", cat: "International", actions: ["story","reel"], pages: ["ambria_in","decor"], priority: 1, note: "Eco-venue showcase, sustainable event practices" },
  { date: "2026-06-06", name: "Eid ul-Adha", cat: "Muslim Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 1, note: "Eid greeting, special feast menu" },
  { date: "2026-06-15", name: "Father's Day", cat: "International", actions: ["story","restaurant"], pages: ["ambria_in","restro"], priority: 1, note: "Father's Day dinner special" },
  { date: "2026-06-30", name: "Pool Parties Peak", cat: "Seasonal", actions: ["ad","host","reel"], pages: ["restro","exotica","events"], priority: 3, adLeadDays: 15, note: "Weekly pool party weekends, BTS reels, influencer collabs" },
  // JUL
  { date: "2026-07-26", name: "Kargil Vijay Diwas", cat: "National", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Tribute story" },
  { date: "2026-07-31", name: "Monsoon Theme Party", cat: "Seasonal", actions: ["story","ad","host"], pages: ["restro","manaktala","events"], priority: 2, adLeadDays: 15, note: "Monsoon party, chai & pakora evening, rain-themed decor" },
  // AUG
  { date: "2026-08-09", name: "Raksha Bandhan", cat: "Hindu Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, note: "Sibling celebration lunch/dinner buffet" },
  { date: "2026-08-15", name: "Independence Day", cat: "National", actions: ["story","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica"], priority: 2, note: "Patriotic content, tricolor decor showcase" },
  { date: "2026-08-16", name: "Janmashtami", cat: "Hindu Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, note: "Krishna-themed story, vegetarian feast" },
  // SEP
  { date: "2026-09-01", name: "Wedding Season Campaign Start", cat: "Business", actions: ["ad","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","decor","events","cuisine"], priority: 3, adLeadDays: 30, note: "BIGGEST AD PUSH — venue tours, real weddings, testimonials, decor showcase" },
  { date: "2026-09-05", name: "Teacher's Day", cat: "National", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Appreciation post" },
  { date: "2026-09-22", name: "Navratri / Dandiya Night", cat: "Hindu Festival", actions: ["story","ad","host","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","decor","restro"], priority: 3, adLeadDays: 20, note: "Dandiya/Garba night, 9-day color series, themed food stalls" },
  // OCT
  { date: "2026-10-02", name: "Dussehra", cat: "Hindu Festival", actions: ["story","ad","host"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events"], priority: 3, adLeadDays: 15, note: "Dussehra celebration, festive venue campaign" },
  { date: "2026-10-10", name: "Karwa Chauth", cat: "Hindu Festival", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","cuisine","decor"], priority: 3, adLeadDays: 20, note: "Karwa Chauth dinner — mehendi, sargi, moonrise, couples buffet at all venues" },
  { date: "2026-10-20", name: "Diwali", cat: "Hindu Festival", actions: ["story","ad","host","restaurant","reel"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine","decor"], priority: 3, adLeadDays: 25, note: "BIGGEST — Diwali party, gala dinner, corporate events, fireworks, decor showcase" },
  { date: "2026-10-22", name: "Bhai Dooj", cat: "Hindu Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro"], priority: 1, note: "Sibling celebration menu" },
  { date: "2026-10-31", name: "Halloween Party", cat: "International", actions: ["story","ad","host","reel"], pages: ["restro","exotica","events"], priority: 3, adLeadDays: 20, note: "Halloween party — costume contest, spooky decor, themed cocktails" },
  // NOV
  { date: "2026-11-01", name: "Peak Wedding Season", cat: "Business", actions: ["ad","reel","story"], pages: ["ambria_in","manaktala","pushpanjali","exotica","decor","events","cuisine"], priority: 3, adLeadDays: 30, note: "Full throttle — daily wedding content, real wedding posts, venue showcases" },
  { date: "2026-11-15", name: "Guru Nanak Jayanti", cat: "Sikh Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Guru Purab greeting" },
  { date: "2026-11-28", name: "Black Friday Booking Deals", cat: "Business", actions: ["ad","story"], pages: ["manaktala","pushpanjali","exotica"], priority: 2, adLeadDays: 15, note: "Black Friday venue booking deals, early bird wedding packages" },
  // DEC
  { date: "2026-12-15", name: "Winter Party Season", cat: "Seasonal", actions: ["ad","host","reel"], pages: ["restro","manaktala","pushpanjali","exotica","events"], priority: 3, adLeadDays: 20, note: "Winter wonderland events, corporate year-end bashes" },
  { date: "2026-12-25", name: "Christmas", cat: "International", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine"], priority: 3, adLeadDays: 20, note: "Christmas party, Xmas brunch/dinner, winter decor, carol night" },
  { date: "2026-12-31", name: "New Year's Eve", cat: "International", actions: ["story","ad","host","restaurant","reel"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine","decor"], priority: 3, adLeadDays: 20, note: "NYE gala — DJ, countdown, premium dinner. Ads from Dec 15" },
];
