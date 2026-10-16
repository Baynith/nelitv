import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Movie, Series, Episode, CastMember } from '../types/media';
import { fetchBase44Movies } from './base44Service';

// Sample movies with Swahili narration options and high quality posters/backdrops
export const SAMPLE_MOVIES: Movie[] = [
  {
    id: 'm-beekeeper-2024',
    title: 'The Beekeeper (Mfugaji Nyuki)',
    originalTitle: 'The Beekeeper',
    overview: 'Adam Clay ni jasusi mstaafu wa shirika la siri linaloitwa Beekeepers. Baada ya mama mlezi wake kudhulumiwa na kundi la wezi wa mtandaoni na kujiua, anaamua kulipiza kisasi na kusafisha genge zima la wahalifu bila huruma.',
    posterPath: 'https://image.tmdb.org/t/p/w500/A7EByudX0eOzlkQ2FIbogzyazm2.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/4woSOUD0equAYzvwhWBHIJDCM88.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    playbackType: 'mp4',
    rating: 7.8,
    voteCount: 1420,
    year: 2024,
    releaseDate: '2024-01-12',
    runtime: 105,
    genres: ['Action', 'Thriller', 'Crime'],
    narrated: true,
    narrationLanguage: 'Swahili',
    originalLanguage: 'en',
    productionCountries: ['United States', 'United Kingdom'],
    featured: true,
    published: true,
    downloadEnabled: true,
    isPremium: false,
    viewsCount: 2840,
    cast: [
      { id: 1, name: 'Jason Statham', character: 'Adam Clay', profilePath: 'https://image.tmdb.org/t/p/w185/whNwkEQYWLFJA8ij00aaPGCIRZw.jpg' },
      { id: 2, name: 'Emmy Raver-Lampman', character: 'Agent Verona Parker', profilePath: 'https://image.tmdb.org/t/p/w185/8p0nJpD5s2GkU0eEa2267Tsmg0R.jpg' },
      { id: 3, name: 'Josh Hutcherson', character: 'Derek Danforth', profilePath: 'https://image.tmdb.org/t/p/w185/744z1Uj2vXgQvQ4f9QeK5h5tD6c.jpg' },
      { id: 4, name: 'Jeremy Irons', character: 'Wallace Westwyld', profilePath: 'https://image.tmdb.org/t/p/w185/jYlqH4r57w5sQWzK7pLqN7fW9.jpg' }
    ]
  },
  {
    id: 'm-dune-2-2024',
    title: 'Dune: Part Two (Mchanga wa Arrakis)',
    originalTitle: 'Dune: Part Two',
    overview: 'Paul Atreides anaungana na Chani na wenyeji wa kabila la Fremen wakati anapotafuta kulipiza kisasi dhidi ya walioharibu familia yake kwenye sayari ya jangwani.',
    posterPath: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    playbackType: 'mp4',
    rating: 8.6,
    voteCount: 4200,
    year: 2024,
    releaseDate: '2024-03-01',
    runtime: 166,
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    narrated: true,
    narrationLanguage: 'Swahili',
    originalLanguage: 'en',
    productionCountries: ['United States'],
    featured: true,
    published: true,
    downloadEnabled: true,
    isPremium: false,
    viewsCount: 4950,
    cast: [
      { id: 5, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: 'https://image.tmdb.org/t/p/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg' },
      { id: 6, name: 'Zendaya', character: 'Chani', profilePath: 'https://image.tmdb.org/t/p/w185/r3A7ev7QkjvJ11iwhT60u20Fw0k.jpg' },
      { id: 7, name: 'Rebecca Ferguson', character: 'Lady Jessica', profilePath: 'https://image.tmdb.org/t/p/w185/6NRnZ4kffGfa0O4Qn8z2Fp7Lp3M.jpg' }
    ]
  },
  {
    id: 'm-deadpool-wolverine-2024',
    title: 'Deadpool & Wolverine (Kazi Ya Mashujaa)',
    originalTitle: 'Deadpool & Wolverine',
    overview: 'Wade Wilson anajikuta kwenye tishio jipya kutoka Time Variance Authority (TVA) na kuamua kumtafuta Wolverine kutoka ulimwengu mwingine ili kuokoa sayari yake.',
    posterPath: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1jv8vE1.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    playbackType: 'mp4',
    rating: 8.1,
    voteCount: 3890,
    year: 2024,
    releaseDate: '2024-07-26',
    runtime: 128,
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    narrated: true,
    narrationLanguage: 'Swahili',
    originalLanguage: 'en',
    productionCountries: ['United States'],
    featured: true,
    published: true,
    downloadEnabled: true,
    isPremium: false,
    viewsCount: 6120,
    cast: [
      { id: 8, name: 'Ryan Reynolds', character: 'Wade Wilson / Deadpool', profilePath: 'https://image.tmdb.org/t/p/w185/4Y7DCBp0yQ1d9D4rF5q1tXk7o9.jpg' },
      { id: 9, name: 'Hugh Jackman', character: 'Logan / Wolverine', profilePath: 'https://image.tmdb.org/t/p/w185/5x8hC1d8kY7z8b6Lp1vK8w9k4zP.jpg' }
    ]
  },
  {
    id: 'm-godzilla-kong-2024',
    title: 'Godzilla x Kong: The New Empire (Ufalme Mpya)',
    originalTitle: 'Godzilla x Kong: The New Empire',
    overview: 'Titan Godzilla na Kong wanakabiliwa na adui mkuu asiyejulikana aliyejificha ndani ya dunia yetu anayetishia kuangamiza jamii nzima ya binadamu.',
    posterPath: 'https://image.tmdb.org/t/p/w500/bQ2ywkchCeOJuvvBg29peaAMpM4.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/qrGtwwWBhaNeAzRjqqK97yD8QhP.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    playbackType: 'mp4',
    rating: 7.2,
    voteCount: 2400,
    year: 2024,
    releaseDate: '2024-03-29',
    runtime: 115,
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    narrated: false,
    originalLanguage: 'en',
    productionCountries: ['United States'],
    featured: false,
    published: true,
    downloadEnabled: true,
    isPremium: false,
    viewsCount: 3100,
    cast: [
      { id: 10, name: 'Rebecca Hall', character: 'Dr. Ilene Andrews', profilePath: 'https://image.tmdb.org/t/p/w185/cf64wVnK9V0y1z6rVn1K9w9k4zP.jpg' },
      { id: 11, name: 'Brian Tyree Henry', character: 'Bernie Hayes', profilePath: 'https://image.tmdb.org/t/p/w185/6m9D6j3w7k4m0v2y1z6rVn1K9w9.jpg' },
      { id: 12, name: 'Dan Stevens', character: 'Trapper', profilePath: 'https://image.tmdb.org/t/p/w185/7h2Xq9v1k9w9k4zP6m9D6j3w7k4.jpg' }
    ]
  },
  {
    id: 'm-gladiator-2-2024',
    title: 'Gladiator II (Shujaa Wa Rumi)',
    originalTitle: 'Gladiator II',
    overview: 'Miaka kadhaa baada ya kifo cha Maximus, Lucius analazimika kuingia kwenye uwanja wa Colosseum baada ya makazi yake kuvamiwa na majenerali wa Roma.',
    posterPath: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRHbtVIeaUhxw.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnEx7vA59xt9b2.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    playbackType: 'mp4',
    rating: 7.6,
    voteCount: 1980,
    year: 2024,
    releaseDate: '2024-11-22',
    runtime: 148,
    genres: ['Action', 'Drama', 'Adventure'],
    narrated: true,
    narrationLanguage: 'Swahili',
    originalLanguage: 'en',
    productionCountries: ['United States', 'United Kingdom'],
    featured: true,
    published: true,
    downloadEnabled: true,
    isPremium: false,
    viewsCount: 3900,
    cast: [
      { id: 13, name: 'Paul Mescal', character: 'Lucius Verus', profilePath: 'https://image.tmdb.org/t/p/w185/x48mP2kL1vK9w9k4zP6m9D6j3w7.jpg' },
      { id: 14, name: 'Pedro Pascal', character: 'Marcus Acacius', profilePath: 'https://image.tmdb.org/t/p/w185/9yZ4w7k4m0v2y1z6rVn1K9w9k4z.jpg' },
      { id: 15, name: 'Denzel Washington', character: 'Macrinus', profilePath: 'https://image.tmdb.org/t/p/w185/tN3v1z6rVn1K9w9k4zP6m9D6j3w.jpg' }
    ]
  },
  {
    id: 'm-extraction-2',
    title: 'Extraction 2 (Oparesheni Ya Uokoaji)',
    originalTitle: 'Extraction 2',
    overview: 'Tyler Rake anarudi kutoka ukingoni mwa kifo ili kukubali ujumbe mwingine hatari: kumwokoa mke aliyetekwa na watoto wa jambazi wa kijojia aliyefungwa gerezani.',
    posterPath: 'https://image.tmdb.org/t/p/w500/7gKI9hpEMcZUwYeCuumAUCunQQ2.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/7I6VUdPj6tQECNHdviJkUHD2f89.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    playbackType: 'mp4',
    rating: 7.7,
    voteCount: 3100,
    year: 2023,
    releaseDate: '2023-06-16',
    runtime: 123,
    genres: ['Action', 'Thriller'],
    narrated: true,
    narrationLanguage: 'Swahili',
    originalLanguage: 'en',
    productionCountries: ['United States'],
    featured: false,
    published: true,
    downloadEnabled: true,
    isPremium: false,
    viewsCount: 5200,
    cast: [
      { id: 16, name: 'Chris Hemsworth', character: 'Tyler Rake', profilePath: 'https://image.tmdb.org/t/p/w185/jpurJ9jBpDCwaRZ0fI7nkWkQ0lW.jpg' },
      { id: 17, name: 'Golshifteh Farahani', character: 'Nik Khan', profilePath: 'https://image.tmdb.org/t/p/w185/1k6q7w9k4zP6m9D6j3w7k4m0v2y.jpg' }
    ]
  },
  {
    id: 'm-bad-boys-4',
    title: 'Bad Boys: Ride or Die (Polisi Wa Miami)',
    originalTitle: 'Bad Boys: Ride or Die',
    overview: 'Mike Lowrey na Marcus Burnett wanarejea katika mapambano makali Miami baada ya kapteni wao marehemu kuhusishwa na biashara haramu ya dawa za kulevya.',
    posterPath: 'https://image.tmdb.org/t/p/w500/nP6RliHjxsz4irTKsxe8FRhKZYl.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    playbackType: 'mp4',
    rating: 7.3,
    voteCount: 1650,
    year: 2024,
    releaseDate: '2024-06-07',
    runtime: 115,
    genres: ['Action', 'Comedy', 'Crime'],
    narrated: true,
    narrationLanguage: 'Swahili',
    originalLanguage: 'en',
    productionCountries: ['United States'],
    featured: false,
    published: true,
    downloadEnabled: true,
    isPremium: false,
    viewsCount: 4100,
    cast: [
      { id: 18, name: 'Will Smith', character: 'Detective Mike Lowrey', profilePath: 'https://image.tmdb.org/t/p/w185/1p4i7tXk7o94Y7DCBp0yQ1d9D4r.jpg' },
      { id: 19, name: 'Martin Lawrence', character: 'Detective Marcus Burnett', profilePath: 'https://image.tmdb.org/t/p/w185/4Y7DCBp0yQ1d9D4rF5q1tXk7o94.jpg' }
    ]
  }
];

// Sample series with seasons and episodes
export const SAMPLE_SERIES: Series[] = [
  {
    id: 's-shogun-2024',
    name: 'Shōgun (Mfalme Wa Kivita)',
    title: 'Shōgun',
    originalName: 'Shōgun',
    overview: 'Katika karne ya 17 nchini Japani, Bwana Toranaga anapambana dhidi ya maadui zake kwenye Baraza la Watawala wakati merikebu ya Kizungu inapovunjika kwenye kijiji cha wavuvi.',
    posterPath: 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/m9m0F6Hj2lJ0x600j5b0j1k0j1.jpg',
    year: 2024,
    rating: 8.9,
    voteCount: 1200,
    genres: ['Drama', 'Action', 'History'],
    seasons: [
      {
        seasonNumber: 1,
        name: 'Season 1',
        episodeCount: 5,
        posterPath: 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg'
      }
    ],
    published: true,
    isPremium: false,
    viewsCount: 6800,
    narrated: true,
    narrationLanguage: 'Swahili',
    cast: [
      { id: 20, name: 'Hiroyuki Sanada', character: 'Lord Yoshii Toranaga', profilePath: 'https://image.tmdb.org/t/p/w185/7jYlqH4r57w5sQWzK7pLqN7fW9.jpg' },
      { id: 21, name: 'Cosmo Jarvis', character: 'John Blackthorne', profilePath: 'https://image.tmdb.org/t/p/w185/8p0nJpD5s2GkU0eEa2267Tsmg0R.jpg' },
      { id: 22, name: 'Anna Sawai', character: 'Toda Mariko', profilePath: 'https://image.tmdb.org/t/p/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg' }
    ]
  },
  {
    id: 's-house-of-dragon',
    name: 'House of the Dragon (Ukoo Wa Joka)',
    title: 'House of the Dragon',
    originalName: 'House of the Dragon',
    overview: 'Miaka 200 kabla ya matukio ya Game of Thrones, vita vya wenyewe kwa wenyewe vinazuka ndani ya familia ya Targaryen kwa ajili ya Kiti cha Chuma cha Enzi cha Westeros.',
    posterPath: 'https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/etj5CuMuam3U9KuV40tHERnKyQ9.jpg',
    year: 2024,
    rating: 8.5,
    voteCount: 3400,
    genres: ['Drama', 'Sci-Fi & Fantasy', 'Action'],
    seasons: [
      {
        seasonNumber: 1,
        name: 'Season 1',
        episodeCount: 4,
        posterPath: 'https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg'
      },
      {
        seasonNumber: 2,
        name: 'Season 2',
        episodeCount: 4,
        posterPath: 'https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg'
      }
    ],
    published: true,
    isPremium: false,
    viewsCount: 9200,
    narrated: true,
    narrationLanguage: 'Swahili',
    cast: [
      { id: 23, name: 'Matt Smith', character: 'Prince Daemon Targaryen', profilePath: 'https://image.tmdb.org/t/p/w185/whNwkEQYWLFJA8ij00aaPGCIRZw.jpg' },
      { id: 24, name: 'Emma D\'Arcy', character: 'Princess Rhaenyra Targaryen', profilePath: 'https://image.tmdb.org/t/p/w185/8p0nJpD5s2GkU0eEa2267Tsmg0R.jpg' }
    ]
  },
  {
    id: 's-reacher',
    name: 'Reacher (Mpelelezi Mkuu)',
    title: 'Reacher',
    originalName: 'Reacher',
    overview: 'Jack Reacher, polisi mstaafu wa kijeshi, anasafiri nchini Marekani akichunguza mauaji na njama tata za kisiasa na rushwa.',
    posterPath: 'https://image.tmdb.org/t/p/w500/j7vAecU129z69k59Z35619p3u2y.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/1Sqa47Wq6Kq2P0Qv57uK2x7Q8v.jpg',
    year: 2023,
    rating: 8.3,
    voteCount: 2100,
    genres: ['Action', 'Crime', 'Drama'],
    seasons: [
      {
        seasonNumber: 1,
        name: 'Season 1',
        episodeCount: 4,
        posterPath: 'https://image.tmdb.org/t/p/w500/j7vAecU129z69k59Z35619p3u2y.jpg'
      }
    ],
    published: true,
    isPremium: false,
    viewsCount: 5100,
    narrated: false,
    cast: [
      { id: 25, name: 'Alan Ritchson', character: 'Jack Reacher', profilePath: 'https://image.tmdb.org/t/p/w185/whNwkEQYWLFJA8ij00aaPGCIRZw.jpg' }
    ]
  }
];

// Sample episodes collection matching Firestore schema: /episodes/{episodeId}
export const SAMPLE_EPISODES: Episode[] = [
  // Shogun Episodes
  {
    id: 'ep-shogun-s1e1',
    seriesId: 's-shogun-2024',
    name: 'Chapter One: Anjin (Mgeni Kutoka Baharini)',
    title: 'Chapter One: Anjin',
    episodeNumber: 1,
    seasonNumber: 1,
    overview: 'Merikebu ya Uholanzi inavunjika pwani ya Japani. Nahodha John Blackthorne anatekwa na watawala wa mtaa huku Toranaga akiona fursa mpya.',
    stillPath: 'https://image.tmdb.org/t/p/w500/r9W8V3p1y6rVn1K9w9k4zP6m9D.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    playbackType: 'mp4',
    runtime: 58,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2024-02-27',
    viewsCount: 1450
  },
  {
    id: 'ep-shogun-s1e2',
    seriesId: 's-shogun-2024',
    name: 'Chapter Two: Servants of Two Masters (Watumishi Wa Mabwana Wawili)',
    title: 'Chapter Two: Servants of Two Masters',
    episodeNumber: 2,
    seasonNumber: 1,
    overview: 'Blackthorne anapelekwa Osaka kukutana na Toranaga huku wakuu wa Kikatoliki wakitaka auawe kabla hajatoa siri za Ulaya.',
    stillPath: 'https://image.tmdb.org/t/p/w500/cf64wVnK9V0y1z6rVn1K9w9k4z.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    playbackType: 'mp4',
    runtime: 56,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2024-02-27',
    viewsCount: 1220
  },
  {
    id: 'ep-shogun-s1e3',
    seriesId: 's-shogun-2024',
    name: 'Chapter Three: Tomorrow is Tomorrow (Kesho Ni Kesho)',
    title: 'Chapter Three: Tomorrow is Tomorrow',
    episodeNumber: 3,
    seasonNumber: 1,
    overview: 'Mpango wa kutoroka ngome ya Osaka unatekelezwa usiku wa giza kupitia msafara wa siri wa Toranaga.',
    stillPath: 'https://image.tmdb.org/t/p/w500/744z1Uj2vXgQvQ4f9QeK5h5tD6c.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    playbackType: 'mp4',
    runtime: 55,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2024-03-05',
    viewsCount: 1080
  },
  {
    id: 'ep-shogun-s1e4',
    seriesId: 's-shogun-2024',
    name: 'Chapter Four: The Eightfold Fence (Ua Wa Maradufu)',
    title: 'Chapter Four: The Eightfold Fence',
    episodeNumber: 4,
    seasonNumber: 1,
    overview: 'Blackthorne na Mariko wanaunda ushirikiano mzito huko Izu wakati wanafunza wanajeshi mbinu mpya za bunduki na mizinga.',
    stillPath: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    playbackType: 'mp4',
    runtime: 60,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2024-03-12',
    viewsCount: 940
  },

  // House of the Dragon Episodes
  {
    id: 'ep-hotd-s1e1',
    seriesId: 's-house-of-dragon',
    name: 'Heirs of the Dragon (Mrithi Wa Joka)',
    title: 'Heirs of the Dragon',
    episodeNumber: 1,
    seasonNumber: 1,
    overview: 'Mfalme Viserys anatangaza binti yake Rhaenyra kuwa mrithi rasmi wa Kiti cha Chuma cha Enzi, akimkatisha tamaa kaka yake Prince Daemon.',
    stillPath: 'https://image.tmdb.org/t/p/w500/etj5CuMuam3U9KuV40tHERnKyQ9.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    playbackType: 'mp4',
    runtime: 66,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2022-08-21',
    viewsCount: 2300
  },
  {
    id: 'ep-hotd-s1e2',
    seriesId: 's-house-of-dragon',
    name: 'The Rogue Prince (Mwanamfalme Muasi)',
    title: 'The Rogue Prince',
    episodeNumber: 2,
    seasonNumber: 1,
    overview: 'Daemon anakalia kisiwa cha Dragonstone na kuiba yai la joka, akijaribu kumlazimisha kaka yake mfalme kuchukua hatua.',
    stillPath: 'https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    playbackType: 'mp4',
    runtime: 54,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2022-08-28',
    viewsCount: 1980
  },
  {
    id: 'ep-hotd-s1e3',
    seriesId: 's-house-of-dragon',
    name: 'Second of His Name (Wa Pili Wa Jina Lake)',
    title: 'Second of His Name',
    episodeNumber: 3,
    seasonNumber: 1,
    overview: 'Mfalme Viserys anasherehekea kuzaliwa kwa mtoto wake wa kiume Aegon kwenye msitu wa Stepstones ambapo vita vikali vinaendelea.',
    stillPath: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRHbtVIeaUhxw.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    playbackType: 'mp4',
    runtime: 63,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2022-09-04',
    viewsCount: 1750
  },

  // Reacher Episodes
  {
    id: 'ep-reacher-s1e1',
    seriesId: 's-reacher',
    name: 'Welcome to Margrave (Karibu Margrave)',
    title: 'Welcome to Margrave',
    episodeNumber: 1,
    seasonNumber: 1,
    overview: 'Jack Reacher anakamatwa kwa tuhuma za mauaji mara tu anaposhuka kutoka basi katika mji mdogo wa Margrave, Georgia.',
    stillPath: 'https://image.tmdb.org/t/p/w500/j7vAecU129z69k59Z35619p3u2y.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    playbackType: 'mp4',
    runtime: 54,
    narrated: false,
    published: true,
    downloadEnabled: true,
    airDate: '2022-02-04',
    viewsCount: 1600
  },
  {
    id: 'ep-reacher-s1e2',
    seriesId: 's-reacher',
    name: 'First Dance (Ngoma Ya Kwanza)',
    title: 'First Dance',
    episodeNumber: 2,
    seasonNumber: 1,
    overview: 'Baada ya kugundua marehemu ni ndugu yake wa damu, Reacher anaungana na afisa Roscoe na Kapteni Finlay kufichua njama.',
    stillPath: 'https://image.tmdb.org/t/p/w500/1Sqa47Wq6Kq2P0Qv57uK2x7Q8v.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    playbackType: 'mp4',
    runtime: 53,
    narrated: false,
    published: true,
    downloadEnabled: true,
    airDate: '2022-02-04',
    viewsCount: 1390
  }
];

// Fetch movies from Base44 (Neliplay Studio central database) or Firestore with fallback to sample movies
export async function getMovies(forceRefresh = false): Promise<Movie[]> {
  try {
    // 1. Primary Source of Truth: Live Base44 Neliplay Studio API
    const base44Movies = await fetchBase44Movies(forceRefresh);
    if (base44Movies && base44Movies.length > 0) {
      return base44Movies;
    }
  } catch (b44Err) {
    console.warn('[Base44] Error fetching movies, checking Firestore:', b44Err);
  }

  try {
    const moviesRef = collection(db, 'movies');
    const snapshot = await getDocs(query(moviesRef, limit(30)));
    if (!snapshot.empty) {
      const fsMovies: Movie[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        fsMovies.push({
          id: doc.id,
          title: data.title || data.name || 'Filamu',
          originalTitle: data.originalTitle,
          overview: data.overview || 'Filamu nzuri ya kusisimua.',
          posterPath: data.posterPath || 'https://image.tmdb.org/t/p/w500/A7EByudX0eOzlkQ2FIbogzyazm2.jpg',
          backdropPath: data.backdropPath || data.posterPath,
          streamUrl: data.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          embedCode: data.embedCode,
          embedUrl: data.embedUrl,
          playbackType: data.playbackType || 'mp4',
          rating: typeof data.rating === 'number' ? data.rating : 7.5,
          voteCount: data.voteCount || 100,
          year: data.year || 2024,
          releaseDate: data.releaseDate,
          runtime: data.runtime || 105,
          genres: Array.isArray(data.genres) ? data.genres : ['Action', 'Thriller'],
          narrated: Boolean(data.narrated || data.narrationLanguage === 'Swahili'),
          narrationLanguage: data.narrationLanguage || (data.narrated ? 'Swahili' : undefined),
          originalLanguage: data.originalLanguage || 'en',
          productionCountries: data.productionCountries,
          featured: data.featured ?? false,
          published: data.published ?? true,
          downloadEnabled: data.downloadEnabled ?? true,
          isPremium: false, // FREE as requested!
          viewsCount: data.viewsCount || 500,
          cast: data.cast || []
        });
      });
      // Merge with sample movies if fewer than 5
      if (fsMovies.length >= 3) {
        return fsMovies;
      }
      return [...fsMovies, ...SAMPLE_MOVIES.filter(sm => !fsMovies.some(fm => fm.id === sm.id))];
    }
  } catch (err) {
    console.warn('Firestore movies query error, using rich sample movies:', err);
  }
  return SAMPLE_MOVIES;
}

// Fetch series from Firestore or fallback to sample series
export async function getSeries(): Promise<Series[]> {
  try {
    const seriesRef = collection(db, 'series');
    const snapshot = await getDocs(query(seriesRef, limit(30)));
    if (!snapshot.empty) {
      const fsSeries: Series[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        fsSeries.push({
          id: doc.id,
          name: data.name || data.title || 'Tamthilia',
          title: data.title || data.name,
          originalName: data.originalName,
          overview: data.overview || 'Tamthilia nzuri ya kusisimua.',
          posterPath: data.posterPath || 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg',
          backdropPath: data.backdropPath || data.posterPath,
          year: data.year || 2024,
          rating: typeof data.rating === 'number' ? data.rating : 8.0,
          voteCount: data.voteCount || 200,
          genres: Array.isArray(data.genres) ? data.genres : ['Drama', 'Action'],
          seasons: data.seasons || [{ seasonNumber: 1, name: 'Season 1', episodeCount: 5 }],
          published: data.published ?? true,
          isPremium: false, // FREE!
          viewsCount: data.viewsCount || 1000,
          narrated: Boolean(data.narrated || data.narrationLanguage === 'Swahili'),
          narrationLanguage: data.narrationLanguage || (data.narrated ? 'Swahili' : undefined),
          cast: data.cast || []
        });
      });
      if (fsSeries.length >= 2) {
        return fsSeries;
      }
      return [...fsSeries, ...SAMPLE_SERIES.filter(ss => !fsSeries.some(fs => fs.id === ss.id))];
    }
  } catch (err) {
    console.warn('Firestore series query error, using sample series:', err);
  }
  return SAMPLE_SERIES;
}

// Fetch episodes for a series (from Firestore /episodes where seriesId == id or sample)
export async function getEpisodesForSeries(seriesId: string): Promise<Episode[]> {
  try {
    const epRef = collection(db, 'episodes');
    const q = query(epRef, where('seriesId', '==', seriesId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const eps: Episode[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        eps.push({
          id: doc.id,
          seriesId: data.seriesId || seriesId,
          name: data.name || data.title || `Episode ${data.episodeNumber || 1}`,
          title: data.title || data.name,
          episodeNumber: data.episodeNumber || 1,
          seasonNumber: data.seasonNumber || 1,
          overview: data.overview,
          stillPath: data.stillPath,
          streamUrl: data.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          embedCode: data.embedCode,
          playbackType: data.playbackType || 'mp4',
          runtime: data.runtime || 50,
          narrated: Boolean(data.narrated || data.narrationLanguage === 'Swahili'),
          narrationLanguage: data.narrationLanguage || (data.narrated ? 'Swahili' : undefined),
          published: data.published ?? true,
          downloadEnabled: data.downloadEnabled ?? true,
          airDate: data.airDate,
          viewsCount: data.viewsCount || 200,
        });
      });
      eps.sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
      return eps;
    }
  } catch (err) {
    console.warn('Firestore episodes query error, checking sample episodes:', err);
  }

  // Filter sample episodes matching seriesId
  const matching = SAMPLE_EPISODES.filter((ep) => ep.seriesId === seriesId);
  if (matching.length > 0) {
    return matching;
  }

  // If no specific sample episodes, generate 4 default episodes so series is immediately watchable!
  return [1, 2, 3, 4].map((num) => ({
    id: `ep-${seriesId}-s1e${num}`,
    seriesId,
    name: `Sehemu ya ${num} (Episode ${num})`,
    title: `Episode ${num}`,
    episodeNumber: num,
    seasonNumber: 1,
    overview: `Matukio ya kusisimua ya sehemu ya ${num}.`,
    stillPath: 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    playbackType: 'mp4',
    runtime: 52,
    narrated: true,
    narrationLanguage: 'Swahili',
    published: true,
    downloadEnabled: true,
    airDate: '2024-03-01',
    viewsCount: 500
  }));
}

// 30-Minute Deterministic Mini-Banner Movie Selector
// "kwenye homepage hapo juu kwenye hiyo banner weka mini banner ioneshe move posters na majina yake ziwe kama new movies na zinabailika sio kila user aone tu hizo hizo zina kaa movie 5 mpaka 6 na sio slider na zinabadilika after every 30 mins na user akibiny anapelekwa kwenye movie details page"
export function getMiniBannerMovies(movies: Movie[]): Movie[] {
  if (!movies || movies.length === 0) return [];
  if (movies.length <= 5) return movies;

  // Window changes every 30 minutes (30 * 60 * 1000 ms)
  const windowIndex = Math.floor(Date.now() / (30 * 60 * 1000));
  
  // Deterministic rotation based on windowIndex
  const total = movies.length;
  const count = Math.min(6, total);
  const selected: Movie[] = [];

  for (let i = 0; i < count; i++) {
    const idx = (windowIndex + i * 2) % total;
    const candidate = movies[idx];
    if (!selected.some(m => m.id === candidate.id)) {
      selected.push(candidate);
    }
  }

  // Fill up if duplicates skipped
  for (const m of movies) {
    if (selected.length >= 6) break;
    if (!selected.some(item => item.id === m.id)) {
      selected.push(m);
    }
  }

  return selected;
}

// Fetch TMDB Cast for movie with server proxy and fallback
export async function fetchCastForMovie(title: string, year?: number, existingCast?: CastMember[]): Promise<CastMember[]> {
  if (existingCast && existingCast.length > 0) {
    return existingCast;
  }

  try {
    const res = await fetch(`/api/tmdb/movie-cast?title=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.cast) && data.cast.length > 0) {
      return data.cast;
    }
  } catch (err) {
    console.warn('Error fetching TMDB cast:', err);
  }

  // Fallback default cast
  return [
    { name: 'Jason Statham', character: 'Shujaa Mkuu', profilePath: 'https://image.tmdb.org/t/p/w185/whNwkEQYWLFJA8ij00aaPGCIRZw.jpg' },
    { name: 'Hiroyuki Sanada', character: 'Kamanda', profilePath: 'https://image.tmdb.org/t/p/w185/7jYlqH4r57w5sQWzK7pLqN7fW9.jpg' },
    { name: 'Zendaya', character: 'Kiongozi Msaidizi', profilePath: 'https://image.tmdb.org/t/p/w185/r3A7ev7QkjvJ11iwhT60u20Fw0k.jpg' },
    { name: 'Pedro Pascal', character: 'Jenerali', profilePath: 'https://image.tmdb.org/t/p/w185/9yZ4w7k4m0v2y1z6rVn1K9w9k4z.jpg' }
  ];
}
