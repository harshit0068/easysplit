[33mcommit 95a033e7fc01b339212bb45f22b03394466cd3d4[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmaster[m[33m, [m[1;31morigin/master[m[33m)[m
Author: harshit0068 <harshitsingh08062004@gmail.com>
Date:   Sun Sep 27 22:59:29 2026 +0530

    Fix settlement balance calculation

[1mdiff --git a/src/pages/GroupDetail.jsx b/src/pages/GroupDetail.jsx[m
[1mindex 318b82d..f47098b 100644[m
[1m--- a/src/pages/GroupDetail.jsx[m
[1m+++ b/src/pages/GroupDetail.jsx[m
[36m@@ -80,8 +80,8 @@[m [mexport default function GroupDetail() {[m
     })[m
 [m
     settlementsData.forEach(s => {[m
[31m-      if (balanceMap[s.paid_by]) balanceMap[s.paid_by].balance -= s.amount[m
[31m-      if (balanceMap[s.paid_to]) balanceMap[s.paid_to].balance += s.amount[m
[32m+[m[32m      if (balanceMap[s.paid_by]) balanceMap[s.paid_by].balance += s.amount[m
[32m+[m[32m      if (balanceMap[s.paid_to]) balanceMap[s.paid_to].balance -= s.amount[m
     })[m
 [m
     setBalances(Object.entries(balanceMap).map(([userId, data]) => ({[m
