Расчёт рекреационной ёмкости для объектов
for (let i = 0; i < 366; i++) { load[i] += BCCq; maxLoad[i] += BCCq; }

Обновление маршрута с новыми значениями нагрузки
После расчёта рекреационной ёмкости для маршрута и связанных с ним объектов, массивы load и maxLoad обновляются в базе данных:

const updateQuery = UPDATE route SET `load` = ?, max_load = ? WHERE id = ?; `;

await pool.query(updateQuery, [ JSON.stringify(load), JSON.stringify(maxLoad), route.id, ]);`

Итоговая формула
Итоговая формула для расчёта рекреационной ёмкости включает компоненты как маршрута, так и связанных с ним объектов, и выглядит следующим образом:

Для маршрута: (DTp/DGp)∗(Ts/Tdp)∗GS∗tp∗(365/tp)(DTp / DGp) _ (Ts / Tdp) _ GS _ tp _ (365 / tp)(DTp/DGp)∗(Ts/Tdp)∗GS∗tp∗(365/tp)
Для объектов: (area/areapervisitor)∗returncoefficient∗days∗(365/days)(area / area*per_visitor) * return*coefficient * days \* (365 / days)(area/areap​erv​isitor)∗returnc​oefficient∗days∗(365/days)
Пример запроса
Пример запроса для проверки расчётов рекреационной ёмкости для конкретного маршрута:

SELECT id, load, max_load FROM route WHERE id = ?;
