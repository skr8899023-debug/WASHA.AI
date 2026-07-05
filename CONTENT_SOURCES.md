# CONTENT_SOURCES — References & verification policy

## Primary sources (facts must trace to these)
| Category | Source |
|---|---|
| Planets, moons, small bodies | NASA Science — Solar System Exploration (science.nasa.gov/solar-system) |
| Live mission/positions context | NASA/JPL Eyes on the Solar System |
| Exoplanets | NASA Exoplanet Exploration (exoplanets.nasa.gov) |
| Planet / dwarf-planet definitions | IAU 2006 Resolution B5 (iau.org) |
| European missions, education | ESA Education / ESA Science |

## Rules applied to the seed dataset
1. Only stable, widely published figures are used (diameters, orbital periods,
   mean distances in AU, rotation periods). These match NASA planetary fact sheets.
2. Volatile values (moon counts of Jupiter/Saturn, exoplanet totals) are written as
   ranges/notes with "يتغير الرقم مع الاكتشافات الجديدة" — the field is text, easy to update.
3. Pluto is presented strictly as a dwarf planet per the IAU definition, with the
   three-criteria explanation (orbit the Sun, hydrostatic equilibrium, cleared neighbourhood).
4. Temperatures are given as rounded representative values or qualitative notes,
   never fake precision.
5. Every body has `sourceNotes` and `lastReviewed` (ISO date).

## Verification status
Seed facts were written from stable NASA/IAU published values (fact-sheet-level numbers).
Before school-wide publication, run a final pass against the NASA pages above and bump
`lastReviewed`. Any figure that cannot be confirmed should be softened to a qualitative note.
