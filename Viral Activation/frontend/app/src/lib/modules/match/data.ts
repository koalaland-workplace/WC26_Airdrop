import type {
  MatchGroup,
  MatchGroupFilter,
  MatchKnockoutFilter,
  MatchKnockoutRound
} from "./types";

export const MATCH_GROUPS: MatchGroup[] = [
  {
    "code": "A",
    "badge": "🇲🇽",
    "name": "GROUP A",
    "teams": [
      {
        "flag": "🇲🇽",
        "name": "Mexico",
        "rank": 15,
        "host": true
      },
      {
        "flag": "🇿🇦",
        "name": "South Africa",
        "rank": 63
      },
      {
        "flag": "🇰🇷",
        "name": "South Korea",
        "rank": 22
      },
      {
        "flag": "🏳️",
        "name": "UEFA P/O D*",
        "rank": "—",
        "tbd": true
      }
    ],
    "matches": [
      {
        "date": "Jun 11",
        "time": "15:00",
        "home": "🇲🇽 Mexico",
        "away": "🇿🇦 South Africa",
        "venue": "Azteca, Mexico City"
      },
      {
        "date": "Jun 11",
        "time": "22:00",
        "home": "🇰🇷 Korea",
        "away": "🏳️ P/O D",
        "venue": "Akron, Guadalajara"
      },
      {
        "date": "Jun 18",
        "time": "12:00",
        "home": "🏳️ P/O D",
        "away": "🇿🇦 South Africa",
        "venue": "Atlanta"
      },
      {
        "date": "Jun 18",
        "time": "21:00",
        "home": "🇲🇽 Mexico",
        "away": "🇰🇷 Korea",
        "venue": "Akron, Guadalajara"
      },
      {
        "date": "Jun 24",
        "time": "21:00",
        "home": "🏳️ P/O D",
        "away": "🇲🇽 Mexico",
        "venue": "Azteca, Mexico City"
      },
      {
        "date": "Jun 24",
        "time": "21:00",
        "home": "🇿🇦 South Africa",
        "away": "🇰🇷 Korea",
        "venue": "Monterrey"
      }
    ]
  },
  {
    "code": "B",
    "badge": "🇨🇦",
    "name": "GROUP B",
    "teams": [
      {
        "flag": "🇨🇦",
        "name": "Canada",
        "rank": 40,
        "host": true
      },
      {
        "flag": "🏳️",
        "name": "UEFA P/O A*",
        "rank": "—",
        "tbd": true
      },
      {
        "flag": "🇶🇦",
        "name": "Qatar",
        "rank": 58
      },
      {
        "flag": "🇨🇭",
        "name": "Switzerland",
        "rank": 19
      }
    ],
    "matches": [
      {
        "date": "Jun 12",
        "time": "15:00",
        "home": "🇨🇦 Canada",
        "away": "🏳️ P/O A",
        "venue": "BMO Field, Toronto"
      },
      {
        "date": "Jun 13",
        "time": "15:00",
        "home": "🇶🇦 Qatar",
        "away": "🇨🇭 Switzerland",
        "venue": "San Francisco"
      },
      {
        "date": "Jun 18",
        "time": "15:00",
        "home": "🇨🇭 Switzerland",
        "away": "🏳️ P/O A",
        "venue": "Los Angeles"
      },
      {
        "date": "Jun 18",
        "time": "18:00",
        "home": "🇨🇦 Canada",
        "away": "🇶🇦 Qatar",
        "venue": "BC Place, Vancouver"
      },
      {
        "date": "Jun 24",
        "time": "15:00",
        "home": "🇨🇭 Switzerland",
        "away": "🇨🇦 Canada",
        "venue": "BC Place, Vancouver"
      },
      {
        "date": "Jun 24",
        "time": "15:00",
        "home": "🏳️ P/O A",
        "away": "🇶🇦 Qatar",
        "venue": "Seattle"
      }
    ]
  },
  {
    "code": "C",
    "badge": "🇧🇷",
    "name": "GROUP C",
    "teams": [
      {
        "flag": "🇧🇷",
        "name": "Brazil",
        "rank": 5
      },
      {
        "flag": "🇲🇦",
        "name": "Morocco",
        "rank": 11
      },
      {
        "flag": "🇭🇹",
        "name": "Haiti",
        "rank": 89
      },
      {
        "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
        "name": "Scotland",
        "rank": 39
      }
    ],
    "matches": [
      {
        "date": "Jun 13",
        "time": "18:00",
        "home": "🇧🇷 Brazil",
        "away": "🇲🇦 Morocco",
        "venue": "MetLife, New Jersey"
      },
      {
        "date": "Jun 13",
        "time": "21:00",
        "home": "🇭🇹 Haiti",
        "away": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
        "venue": "Gillette, Boston"
      },
      {
        "date": "Jun 19",
        "time": "18:00",
        "home": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
        "away": "🇲🇦 Morocco",
        "venue": "Gillette, Boston"
      },
      {
        "date": "Jun 19",
        "time": "21:00",
        "home": "🇧🇷 Brazil",
        "away": "🇭🇹 Haiti",
        "venue": "Philadelphia"
      },
      {
        "date": "Jun 24",
        "time": "18:00",
        "home": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
        "away": "🇧🇷 Brazil",
        "venue": "Hard Rock, Miami"
      },
      {
        "date": "Jun 24",
        "time": "18:00",
        "home": "🇲🇦 Morocco",
        "away": "🇭🇹 Haiti",
        "venue": "Atlanta"
      }
    ]
  },
  {
    "code": "D",
    "badge": "🇺🇸",
    "name": "GROUP D",
    "teams": [
      {
        "flag": "🇺🇸",
        "name": "USA",
        "rank": 14,
        "host": true
      },
      {
        "flag": "🇵🇾",
        "name": "Paraguay",
        "rank": 61
      },
      {
        "flag": "🇦🇺",
        "name": "Australia",
        "rank": 26
      },
      {
        "flag": "🏳️",
        "name": "UEFA P/O C*",
        "rank": "—",
        "tbd": true
      }
    ],
    "matches": [
      {
        "date": "Jun 12",
        "time": "21:00",
        "home": "🇺🇸 USA",
        "away": "🇵🇾 Paraguay",
        "venue": "SoFi, Los Angeles"
      },
      {
        "date": "Jun 13",
        "time": "00:00",
        "home": "🇦🇺 Australia",
        "away": "🏳️ P/O C",
        "venue": "BC Place, Vancouver"
      },
      {
        "date": "Jun 19",
        "time": "00:00",
        "home": "🏳️ P/O C",
        "away": "🇵🇾 Paraguay",
        "venue": "San Francisco"
      },
      {
        "date": "Jun 19",
        "time": "15:00",
        "home": "🇺🇸 USA",
        "away": "🇦🇺 Australia",
        "venue": "Lumen Field, Seattle"
      },
      {
        "date": "Jun 25",
        "time": "22:00",
        "home": "🏳️ P/O C",
        "away": "🇺🇸 USA",
        "venue": "SoFi, Los Angeles"
      },
      {
        "date": "Jun 25",
        "time": "22:00",
        "home": "🇵🇾 Paraguay",
        "away": "🇦🇺 Australia",
        "venue": "San Francisco"
      }
    ]
  },
  {
    "code": "E",
    "badge": "🇩🇪",
    "name": "GROUP E",
    "teams": [
      {
        "flag": "🇩🇪",
        "name": "Germany",
        "rank": 9
      },
      {
        "flag": "🇨🇼",
        "name": "Curaçao",
        "rank": 82
      },
      {
        "flag": "🇨🇮",
        "name": "Ivory Coast",
        "rank": 48
      },
      {
        "flag": "🇪🇨",
        "name": "Ecuador",
        "rank": 38
      }
    ],
    "matches": [
      {
        "date": "Jun 14",
        "time": "13:00",
        "home": "🇩🇪 Germany",
        "away": "🇨🇼 Curaçao",
        "venue": "NRG Stadium, Houston"
      },
      {
        "date": "Jun 14",
        "time": "19:00",
        "home": "🇨🇮 Ivory Coast",
        "away": "🇪🇨 Ecuador",
        "venue": "Philadelphia"
      },
      {
        "date": "Jun 20",
        "time": "16:00",
        "home": "🇩🇪 Germany",
        "away": "🇨🇮 Ivory Coast",
        "venue": "BMO Field, Toronto"
      },
      {
        "date": "Jun 20",
        "time": "20:00",
        "home": "🇪🇨 Ecuador",
        "away": "🇨🇼 Curaçao",
        "venue": "Kansas City"
      },
      {
        "date": "Jun 25",
        "time": "16:00",
        "home": "🇨🇼 Curaçao",
        "away": "🇨🇮 Ivory Coast",
        "venue": "Philadelphia"
      },
      {
        "date": "Jun 25",
        "time": "16:00",
        "home": "🇪🇨 Ecuador",
        "away": "🇩🇪 Germany",
        "venue": "Dallas"
      }
    ]
  },
  {
    "code": "F",
    "badge": "🇳🇱",
    "name": "GROUP F",
    "teams": [
      {
        "flag": "🇳🇱",
        "name": "Netherlands",
        "rank": 7
      },
      {
        "flag": "🇯🇵",
        "name": "Japan",
        "rank": 17
      },
      {
        "flag": "🏳️",
        "name": "UEFA P/O B*",
        "rank": "—",
        "tbd": true
      },
      {
        "flag": "🇹🇳",
        "name": "Tunisia",
        "rank": 53
      }
    ],
    "matches": [
      {
        "date": "Jun 14",
        "time": "16:00",
        "home": "🇳🇱 Netherlands",
        "away": "🇹🇳 Tunisia",
        "venue": "Kansas City"
      },
      {
        "date": "Jun 14",
        "time": "22:00",
        "home": "🇯🇵 Japan",
        "away": "🏳️ P/O B",
        "venue": "Dallas"
      },
      {
        "date": "Jun 20",
        "time": "12:00",
        "home": "🏳️ P/O B",
        "away": "🇹🇳 Tunisia",
        "venue": "Seattle"
      },
      {
        "date": "Jun 20",
        "time": "15:00",
        "home": "🇳🇱 Netherlands",
        "away": "🇯🇵 Japan",
        "venue": "Los Angeles"
      },
      {
        "date": "Jun 25",
        "time": "12:00",
        "home": "🏳️ P/O B",
        "away": "🇳🇱 Netherlands",
        "venue": "Boston"
      },
      {
        "date": "Jun 25",
        "time": "12:00",
        "home": "🇹🇳 Tunisia",
        "away": "🇯🇵 Japan",
        "venue": "Houston"
      }
    ]
  },
  {
    "code": "G",
    "badge": "🇧🇪",
    "name": "GROUP G",
    "teams": [
      {
        "flag": "🇧🇪",
        "name": "Belgium",
        "rank": 8
      },
      {
        "flag": "🇪🇬",
        "name": "Egypt",
        "rank": 35
      },
      {
        "flag": "🇮🇷",
        "name": "Iran",
        "rank": 22
      },
      {
        "flag": "🇳🇿",
        "name": "New Zealand",
        "rank": 96
      }
    ],
    "matches": [
      {
        "date": "Jun 15",
        "time": "12:00",
        "home": "🇧🇪 Belgium",
        "away": "🇪🇬 Egypt",
        "venue": "Dallas"
      },
      {
        "date": "Jun 15",
        "time": "15:00",
        "home": "🇮🇷 Iran",
        "away": "🇳🇿 New Zealand",
        "venue": "Kansas City"
      },
      {
        "date": "Jun 20",
        "time": "19:00",
        "home": "🇪🇬 Egypt",
        "away": "🇳🇿 New Zealand",
        "venue": "Boston"
      },
      {
        "date": "Jun 20",
        "time": "22:00",
        "home": "🇧🇪 Belgium",
        "away": "🇮🇷 Iran",
        "venue": "New York/NJ"
      },
      {
        "date": "Jun 26",
        "time": "20:00",
        "home": "🇪🇬 Egypt",
        "away": "🇧🇪 Belgium",
        "venue": "Miami"
      },
      {
        "date": "Jun 26",
        "time": "20:00",
        "home": "🇳🇿 New Zealand",
        "away": "🇮🇷 Iran",
        "venue": "Los Angeles"
      }
    ]
  },
  {
    "code": "H",
    "badge": "🇪🇸",
    "name": "GROUP H",
    "teams": [
      {
        "flag": "🇪🇸",
        "name": "Spain",
        "rank": 1
      },
      {
        "flag": "🇨🇻",
        "name": "Cape Verde",
        "rank": 68
      },
      {
        "flag": "🇸🇦",
        "name": "Saudi Arabia",
        "rank": 57
      },
      {
        "flag": "🇺🇾",
        "name": "Uruguay",
        "rank": 16
      }
    ],
    "matches": [
      {
        "date": "Jun 15",
        "time": "12:00",
        "home": "🇪🇸 Spain",
        "away": "🇨🇻 Cape Verde",
        "venue": "Atlanta"
      },
      {
        "date": "Jun 15",
        "time": "19:00",
        "home": "🇸🇦 Saudi Arabia",
        "away": "🇺🇾 Uruguay",
        "venue": "Dallas"
      },
      {
        "date": "Jun 21",
        "time": "12:00",
        "home": "🇪🇸 Spain",
        "away": "🇸🇦 Saudi Arabia",
        "venue": "Atlanta"
      },
      {
        "date": "Jun 21",
        "time": "18:00",
        "home": "🇺🇾 Uruguay",
        "away": "🇨🇻 Cape Verde",
        "venue": "Miami"
      },
      {
        "date": "Jun 26",
        "time": "16:00",
        "home": "🇨🇻 Cape Verde",
        "away": "🇸🇦 Saudi Arabia",
        "venue": "Houston"
      },
      {
        "date": "Jun 26",
        "time": "16:00",
        "home": "🇺🇾 Uruguay",
        "away": "🇪🇸 Spain",
        "venue": "Boston"
      }
    ]
  },
  {
    "code": "I",
    "badge": "🇫🇷",
    "name": "GROUP I",
    "teams": [
      {
        "flag": "🇫🇷",
        "name": "France",
        "rank": 3
      },
      {
        "flag": "🇸🇳",
        "name": "Senegal",
        "rank": 20
      },
      {
        "flag": "🇳🇴",
        "name": "Norway",
        "rank": 12
      },
      {
        "flag": "🏳️",
        "name": "Inter P/O 2*",
        "rank": "—",
        "tbd": true
      }
    ],
    "matches": [
      {
        "date": "Jun 15",
        "time": "18:00",
        "home": "🇫🇷 France",
        "away": "🇸🇳 Senegal",
        "venue": "Houston"
      },
      {
        "date": "Jun 15",
        "time": "22:00",
        "home": "🇳🇴 Norway",
        "away": "🏳️ Inter P/O 2",
        "venue": "Philadelphia"
      },
      {
        "date": "Jun 21",
        "time": "15:00",
        "home": "🇸🇳 Senegal",
        "away": "🏳️ Inter P/O 2",
        "venue": "Dallas"
      },
      {
        "date": "Jun 21",
        "time": "19:00",
        "home": "🇫🇷 France",
        "away": "🇳🇴 Norway",
        "venue": "New York/NJ"
      },
      {
        "date": "Jun 26",
        "time": "12:00",
        "home": "🏳️ Inter P/O 2",
        "away": "🇫🇷 France",
        "venue": "Miami"
      },
      {
        "date": "Jun 26",
        "time": "12:00",
        "home": "🇸🇳 Senegal",
        "away": "🇳🇴 Norway",
        "venue": "Kansas City"
      }
    ]
  },
  {
    "code": "J",
    "badge": "🇦🇷",
    "name": "GROUP J",
    "teams": [
      {
        "flag": "🇦🇷",
        "name": "Argentina",
        "rank": 2
      },
      {
        "flag": "🇩🇿",
        "name": "Algeria",
        "rank": 33
      },
      {
        "flag": "🇦🇹",
        "name": "Austria",
        "rank": 25
      },
      {
        "flag": "🇯🇴",
        "name": "Jordan",
        "rank": 77
      }
    ],
    "matches": [
      {
        "date": "Jun 16",
        "time": "15:00",
        "home": "🇦🇷 Argentina",
        "away": "🇩🇿 Algeria",
        "venue": "MetLife, New Jersey"
      },
      {
        "date": "Jun 16",
        "time": "00:00",
        "home": "🇦🇹 Austria",
        "away": "🇯🇴 Jordan",
        "venue": "San Francisco"
      },
      {
        "date": "Jun 21",
        "time": "22:00",
        "home": "🇩🇿 Algeria",
        "away": "🇯🇴 Jordan",
        "venue": "Seattle"
      },
      {
        "date": "Jun 22",
        "time": "02:00",
        "home": "🇦🇷 Argentina",
        "away": "🇦🇹 Austria",
        "venue": "Dallas"
      },
      {
        "date": "Jun 26",
        "time": "20:00",
        "home": "🇩🇿 Algeria",
        "away": "🇦🇷 Argentina",
        "venue": "Los Angeles"
      },
      {
        "date": "Jun 26",
        "time": "20:00",
        "home": "🇯🇴 Jordan",
        "away": "🇦🇹 Austria",
        "venue": "Boston"
      }
    ]
  },
  {
    "code": "K",
    "badge": "🇵🇹",
    "name": "GROUP K",
    "teams": [
      {
        "flag": "🇵🇹",
        "name": "Portugal",
        "rank": 6
      },
      {
        "flag": "🏳️",
        "name": "Inter P/O 1*",
        "rank": "—",
        "tbd": true
      },
      {
        "flag": "🇺🇿",
        "name": "Uzbekistan",
        "rank": 50
      },
      {
        "flag": "🇨🇴",
        "name": "Colombia",
        "rank": 13
      }
    ],
    "matches": [
      {
        "date": "Jun 16",
        "time": "13:00",
        "home": "🇵🇹 Portugal",
        "away": "🏳️ Inter P/O 1",
        "venue": "Houston"
      },
      {
        "date": "Jun 16",
        "time": "19:00",
        "home": "🇺🇿 Uzbekistan",
        "away": "🇨🇴 Colombia",
        "venue": "Philadelphia"
      },
      {
        "date": "Jun 22",
        "time": "13:00",
        "home": "🏳️ Inter P/O 1",
        "away": "🇺🇿 Uzbekistan",
        "venue": "Kansas City"
      },
      {
        "date": "Jun 22",
        "time": "19:00",
        "home": "🇵🇹 Portugal",
        "away": "🇨🇴 Colombia",
        "venue": "Miami"
      },
      {
        "date": "Jun 27",
        "time": "07:30",
        "home": "🏳️ Inter P/O 1",
        "away": "🇵🇹 Portugal",
        "venue": "Atlanta"
      },
      {
        "date": "Jun 27",
        "time": "07:30",
        "home": "🇨🇴 Colombia",
        "away": "🇺🇿 Uzbekistan",
        "venue": "Seattle"
      }
    ]
  },
  {
    "code": "L",
    "badge": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "name": "GROUP L",
    "teams": [
      {
        "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        "name": "England",
        "rank": 4
      },
      {
        "flag": "🇭🇷",
        "name": "Croatia",
        "rank": 10
      },
      {
        "flag": "🇬🇭",
        "name": "Ghana",
        "rank": 60
      },
      {
        "flag": "🇵🇦",
        "name": "Panama",
        "rank": 73
      }
    ],
    "matches": [
      {
        "date": "Jun 17",
        "time": "18:00",
        "home": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
        "away": "🇭🇷 Croatia",
        "venue": "AT&T Stadium, Dallas"
      },
      {
        "date": "Jun 17",
        "time": "22:00",
        "home": "🇬🇭 Ghana",
        "away": "🇵🇦 Panama",
        "venue": "Los Angeles"
      },
      {
        "date": "Jun 22",
        "time": "16:00",
        "home": "🇭🇷 Croatia",
        "away": "🇵🇦 Panama",
        "venue": "New York/NJ"
      },
      {
        "date": "Jun 22",
        "time": "22:00",
        "home": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
        "away": "🇬🇭 Ghana",
        "venue": "Houston"
      },
      {
        "date": "Jun 27",
        "time": "16:00",
        "home": "🇭🇷 Croatia",
        "away": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
        "venue": "Philadelphia"
      },
      {
        "date": "Jun 27",
        "time": "16:00",
        "home": "🇵🇦 Panama",
        "away": "🇬🇭 Ghana",
        "venue": "Atlanta"
      }
    ]
  }
];

export const MATCH_KNOCKOUT_ROUNDS: MatchKnockoutRound[] = [
  {
    "id": "R16",
    "label": "R-16",
    "badge": "🔥",
    "matches": [
      {
        "slot": "M81",
        "date": "Jul 9",
        "time": "15:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "MetLife Stadium (NJ)"
      },
      {
        "slot": "M82",
        "date": "Jul 9",
        "time": "19:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "AT&T Stadium (Dallas)"
      },
      {
        "slot": "M83",
        "date": "Jul 10",
        "time": "15:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "SoFi Stadium (LA)"
      },
      {
        "slot": "M84",
        "date": "Jul 10",
        "time": "19:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "Mercedes-Benz Stadium (Atlanta)"
      },
      {
        "slot": "M85",
        "date": "Jul 11",
        "time": "15:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "BC Place (Vancouver)"
      },
      {
        "slot": "M86",
        "date": "Jul 11",
        "time": "19:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "Estadio Azteca (Mexico)"
      },
      {
        "slot": "M87",
        "date": "Jul 12",
        "time": "15:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "NRG Stadium (Houston)"
      },
      {
        "slot": "M88",
        "date": "Jul 12",
        "time": "19:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "Levi's Stadium (SF)"
      }
    ]
  },
  {
    "id": "QF",
    "label": "Quarter-Finals",
    "badge": "⚡",
    "matches": [
      {
        "slot": "M89",
        "date": "Jul 16",
        "time": "15:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "MetLife Stadium (NJ)"
      },
      {
        "slot": "M90",
        "date": "Jul 16",
        "time": "19:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "SoFi Stadium (LA)"
      },
      {
        "slot": "M91",
        "date": "Jul 17",
        "time": "15:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "AT&T Stadium (Dallas)"
      },
      {
        "slot": "M92",
        "date": "Jul 17",
        "time": "19:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "Mercedes-Benz Stadium (Atlanta)"
      }
    ]
  },
  {
    "id": "SF",
    "label": "Semi-Finals",
    "badge": "🏅",
    "matches": [
      {
        "slot": "M93",
        "date": "Jul 22",
        "time": "20:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "MetLife Stadium (NJ)"
      },
      {
        "slot": "M94",
        "date": "Jul 23",
        "time": "20:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "Rose Bowl (LA)"
      }
    ]
  },
  {
    "id": "FINAL",
    "label": "Final 🏆",
    "badge": "🏆",
    "matches": [
      {
        "slot": "3rd",
        "date": "Jul 25",
        "time": "16:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "MetLife Stadium (NJ)"
      },
      {
        "slot": "FINAL",
        "date": "Jul 19 2026",
        "time": "20:00",
        "home": "TBD",
        "away": "TBD",
        "venue": "MetLife Stadium (NJ)"
      }
    ]
  }
];

export const MATCH_GROUP_FILTERS: MatchGroupFilter[] = [
  {
    "id": "GROUP:A",
    "label": "A"
  },
  {
    "id": "GROUP:B",
    "label": "B"
  },
  {
    "id": "GROUP:C",
    "label": "C"
  },
  {
    "id": "GROUP:D",
    "label": "D"
  },
  {
    "id": "GROUP:E",
    "label": "E"
  },
  {
    "id": "GROUP:F",
    "label": "F"
  },
  {
    "id": "GROUP:G",
    "label": "G"
  },
  {
    "id": "GROUP:H",
    "label": "H"
  },
  {
    "id": "GROUP:I",
    "label": "I"
  },
  {
    "id": "GROUP:J",
    "label": "J"
  },
  {
    "id": "GROUP:K",
    "label": "K"
  },
  {
    "id": "GROUP:L",
    "label": "L"
  }
];

export const MATCH_KNOCKOUT_FILTERS: MatchKnockoutFilter[] = [
  {
    "id": "KO:R16",
    "label": "R-16"
  },
  {
    "id": "KO:QF",
    "label": "Quarter-Finals"
  },
  {
    "id": "KO:SF",
    "label": "Semi-Finals"
  },
  {
    "id": "KO:FINAL",
    "label": "Final"
  }
];
