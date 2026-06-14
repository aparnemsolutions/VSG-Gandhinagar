import { useEffect, useMemo, useState } from "react";
import { BookOpen, Phone, Search, X } from "lucide-react";
import { useSheets } from "../hooks/useSheets";
import { useNavigate } from "react-router-dom";
import { fetchDirectoryRecords } from "../utils/directoryLoader";

const DIRECTORY_PROFILE_KEYS = [
  "Email Id",
  "First Name",
  "Middle Name",
  "Last Name",
  "Gender",
  "Blood Group",
  "Contact Number",
  "Address",
  "Area",
  "City",
  "Work Type",
  "Company / Business Name",
  "Occupation / Profession",
  "Team",
  "Office Location / Business Area",
];

export default function ViharDirectory() {
  const { entries, config, loading, syncAll } = useSheets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [people, setPeople] = useState(null);
  const [fetchingDirectory, setFetchingDirectory] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  const navigate = useNavigate();

  async function loadDirectory() {
    setFetchingDirectory(true);
    setFetchError("");
    try {
      const records = await fetchDirectoryRecords();
      const filtered = records.map((record) => {
        const normalized = { _rowIndex: record._rowIndex };
        DIRECTORY_PROFILE_KEYS.forEach((key) => {
          if (
            Object.prototype.hasOwnProperty.call(record, key) &&
            String(record[key] ?? "").trim() !== ""
          ) {
            normalized[key] = record[key];
          }
        });
        return normalized;
      });
      setPeople(filtered);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Failed to load directory.",
      );
      setPeople(null);
    } finally {
      setFetchingDirectory(false);
    }
  }

  useEffect(() => {
    loadDirectory();
  }, []);

  function getPersonName(person) {
    if (!person) return "";
    const directName = String(
      person.Name ||
        person.name ||
        person["Full Name"] ||
        person.FullName ||
        "",
    ).trim();
    if (directName) return directName;

    const first = String(person["First Name"] || person.FirstName || "").trim();
    const middle = String(
      person["Middle Name"] || person.MiddleName || "",
    ).trim();
    const last = String(person["Last Name"] || person.LastName || "").trim();
    const full = [first, middle, last].filter(Boolean).join(" ");
    return full || String(person["Email Id"] || person.email || "").trim();
  }

  function getPersonWorkType(person) {
    if (!person) return "";
    return String(person["Work Type"] || person.WorkType || "").trim();
  }

  function getPersonOccupation(person) {
    if (!person) return "";
    return String(person["Occupation / Profession"] || person.OccupationProfession || "").trim();
  }

  function getPersonTeam(person) {
    if (!person) return "";
    return String(person["Team"] || person.team || "").trim();
  }

  function getPersonPhone(person) {
    if (!person) return "";
    return String(
      person["Contact Number"] ||
        person["Phone"] ||
        person.ContactNumber ||
        person.phone ||
        "",
    ).trim();
  }

  const query = searchQuery.trim().toLowerCase();
  const filteredPeople = useMemo(() => {
    if (!people) return [];
    // apply search query first
    let filtered = people;
    if (query) {
      filtered = people.filter((person) => {
        const name = getPersonName(person).toLowerCase();
        const workType = getPersonWorkType(person).toLowerCase();
        const occupation = getPersonOccupation(person).toLowerCase();
        const team = getPersonTeam(person).toLowerCase();
        const note = String(person.Note || person.note || "").toLowerCase();
        const email = String(
          person["Email Id"] || person.email || person.Email || "",
        ).toLowerCase();
        const section = String(
          person.Section ||
            person.section ||
            person["Area"] ||
            person.area ||
            person["City"] ||
            person.city ||
            "",
        ).toLowerCase();
        const contact = getPersonPhone(person).toLowerCase();

        return (
          name.includes(query) ||
          workType.includes(query) ||
          occupation.includes(query) ||
          team.includes(query) ||
          note.includes(query) ||
          email.includes(query) ||
          section.includes(query) ||
          contact.includes(query)
        );
      });
    }

    // apply work type filter (if selected)
    if (workTypeFilter) {
      filtered = filtered.filter((person) => {
        const wt = getPersonWorkType(person);
        return wt.toLowerCase() === workTypeFilter.toLowerCase();
      });
    }

    // apply team filter (if selected)
    if (teamFilter) {
      filtered = filtered.filter((person) => {
        const t = String(person["Team"] || person.team || "").trim();
        return t.toLowerCase() === teamFilter.toLowerCase();
      });
    }

    // Sort alphabetically by name
    return filtered.sort((a, b) => {
      const nameA = getPersonName(a).toLowerCase();
      const nameB = getPersonName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [people, query, workTypeFilter, teamFilter]);

  const workTypeOptions = useMemo(() => {
    if (!people) return [];
    const set = new Set();
    people.forEach((p) => {
      const v = getPersonWorkType(p);
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [people]);

  const teamOptions = useMemo(() => {
  if (!people) return [];
  const set = new Set();
  people.forEach((p) => {
    const v = String(p["Team"] || p.team || "").trim();
    if (v) set.add(v);
  });

  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return Array.from(set).sort((a, b) => {
    const dayA = DAY_ORDER.indexOf(a);
    const dayB = DAY_ORDER.indexOf(b);
    if (dayA !== -1 && dayB !== -1) return dayA - dayB;
    if (dayA !== -1) return -1;
    if (dayB !== -1) return 1;
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
}, [people]);

  useEffect(() => {
    if (!selectedPerson) return;
    const selectedName = getPersonName(selectedPerson).trim();
    if (!selectedName) return;
    const stillVisible = filteredPeople.some(
      (person) => getPersonName(person).trim() === selectedName,
    );
    if (!stillVisible) setSelectedPerson(null);
  }, [filteredPeople, selectedPerson]);

  const yearLabel =
    config?.appConfig?.current_year_label || new Date().getFullYear();
  const yearKey = String(yearLabel);
  const currentYearVihars = useMemo(() => {
    if (!selectedPerson) return [];
    const personName = getPersonName(selectedPerson).trim();
    if (!personName) return [];

    return entries
      .filter((entry) => String(entry.date).slice(0, 4) === yearKey)
      .filter((entry) => {
        const sevaks = Array.isArray(entry.sevak) ? entry.sevak : [entry.sevak];
        const sevikas = Array.isArray(entry.sevika)
          ? entry.sevika
          : [entry.sevika];
        return (
          sevaks.some((name) => String(name).trim() === personName) ||
          sevikas.some((name) => String(name).trim() === personName)
        );
      });
  }, [entries, selectedPerson, yearKey]);

  function parseCsv(csvText) {
    const lines = csvText.split(/\r?\n/);
    return lines
      .map((line) => {
        const row = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
            continue;
          }

          if (char === "," && !inQuotes) {
            row.push(current);
            current = "";
            continue;
          }

          current += char;
        }

        row.push(current);
        return row;
      })
      .filter((row) => row.some((cell) => String(cell || "").trim()));
  }

  function findHeaderRowIndex(rows) {
    for (let i = 0; i < rows.length; i += 1) {
      const nonEmptyCells = rows[i].filter((cell) =>
        String(cell || "").trim(),
      ).length;
      if (nonEmptyCells >= 2) {
        return i;
      }
    }
    return 0;
  }

  function getDisplayValue(person, key) {
    const value = person[key];
    if (Array.isArray(value)) return value.join(", ");
    if (value === null || value === undefined) return "";
    return String(value);
  }

  function getDetailKeys(person) {
    const keys = Object.keys(person).filter(
      (key) => key && !/^name$/i.test(key),
    );
    const preferred = ["Role", "Section", "Phone", "Email", "Note"];
    return [
      ...preferred.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !preferred.includes(key)),
    ];
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      <header className="px-4 pt-4 pb-3 bg-[#C96800] flex items-center gap-3">
        {isSearchOpen ? (
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
            <Search size={18} className="text-white flex-shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Vihar Sevak or Sevika"
              className="w-full bg-transparent text-white placeholder:text-white/70 outline-none text-sm font-semibold"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="text-white p-1 rounded-lg hover:bg-white/10 flex-shrink-0"
              aria-label="Close search"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <h1 className="text-white font-black text-base flex-1">
            Vihar Directory
          </h1>
        )}

        {!isSearchOpen && (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="text-white p-2 rounded-xl hover:bg-orange-700"
            aria-label="Search"
            title="Search"
          >
            <Search size={18} />
          </button>
        )}
        <button
          onClick={() => {
            syncAll();
            loadDirectory();
          }}
          className="text-white p-2 rounded-xl hover:bg-orange-700"
          title="Refresh"
        >
          <BookOpen
            size={18}
            className={loading || fetchingDirectory ? "animate-spin" : ""}
          />
        </button>
      </header>

      <div className="scroll-area px-4 pt-5 pb-28 space-y-4">
        <div className="bg-white border border-[#F5E5B0] rounded-2xl overflow-hidden">
          <div className="bg-[#FFFDF5] border-b border-[#F5E5B0] px-4 py-3">
            <p className="font-black text-sm text-[#C96800]">
              {fetchingDirectory
                ? "Loading…"
                : `${filteredPeople.length} people`}
            </p>
          </div>

          {(workTypeOptions.length > 0 || teamOptions.length > 0) && (
            <div className="px-4 py-2 border-b border-[#F5E5B0] bg-white">
              <div className="flex items-center gap-3">
                {workTypeOptions.length > 0 && (
                  <>
                    <label className="text-[11px] text-[#8B6525] font-bold">
                      Work type
                    </label>
                    <select
                      value={workTypeFilter}
                      onChange={(e) => setWorkTypeFilter(e.target.value)}
                      className="text-xs p-1 px-2 rounded-lg border border-[#E8C97A] bg-white"
                      aria-label="Filter by work type"
                      style={{ minWidth: 120 }}
                    >
                      <option value="">All</option>
                      {workTypeOptions.map((wt) => (
                        <option key={wt} value={wt}>
                          {wt}
                        </option>
                      ))}
                    </select>
                    {workTypeFilter && (
                      <button
                        type="button"
                        onClick={() => setWorkTypeFilter("")}
                        className="text-xs text-[#C96800] font-bold"
                        aria-label="Clear work type filter"
                        title="Clear"
                      >
                        Clear
                      </button>
                    )}
                  </>
                )}

                {teamOptions.length > 0 && (
                  <>
                    <label className="text-[11px] text-[#8B6525] font-bold">
                      Team
                    </label>
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="text-xs p-1 px-2 rounded-lg border border-[#E8C97A] bg-white"
                      aria-label="Filter by team"
                      style={{ minWidth: 120 }}
                    >
                      <option value="">All</option>
                      {teamOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {teamFilter && (
                      <button
                        type="button"
                        onClick={() => setTeamFilter("")}
                        className="text-xs text-[#C96800] font-bold"
                        aria-label="Clear team filter"
                        title="Clear"
                      >
                        Clear
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {fetchingDirectory ? (
            <div className="px-4 py-8 text-center text-sm text-[#8B6525]">
              Loading directory…
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#8B6525]">
              {query
                ? "No matching names found."
                : "No directory entries available."}
            </div>
          ) : (
            <div className="divide-y divide-[#F5E5B0]">
              {filteredPeople.map((person, index) => {
                const name = getPersonName(person) || "Unknown";
                const phone = getPersonPhone(person);
                const workType = getPersonWorkType(person);
                const occupation = getPersonOccupation(person);
                const team = getPersonTeam(person);
                return (
                  <button
                    key={`${person._rowIndex || index}-${index}`}
                    type="button"
                    onClick={() =>
                      navigate(`/directory/${person._rowIndex || index + 1}`, {
                        state: { person },
                      })
                    }
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                      false ? "bg-[#FFF3D6]" : "hover:bg-[#FFF7E2]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#3D1F00] text-sm truncate">
                        {name}
                      </p>
                      <p className="text-[11px] text-[#8B6525] mt-1 truncate flex items-center gap-2">
                        <span className="truncate">{workType}</span>
                        <span className="text-[#C96800]">|</span>
                        <span className="truncate">{occupation}</span>
                        {/* <span className="text-[#C96800]">|</span>
                        <span className="truncate">{team}</span> */}
                      </p>
                      <p className="text-[#C96800] text-[11px] font-bold mt-1">{team} Team</p>
                    </div>
                    {phone ? (
                      <a
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        className="flex items-center justify-center w-9 h-9 bg-[#1B7A3A] text-white rounded-xl"
                      >
                        <Phone size={14} />
                      </a>
                    ) : (
                      <div className="w-9 h-9" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedPerson && (
          <div className="space-y-4">
            <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#C96800] text-white flex items-center justify-center font-black text-xl">
                  {getPersonName(selectedPerson).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-lg text-[#3D1F00] truncate">
                    {getPersonName(selectedPerson)}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#8B6525] mt-1 truncate flex items-center gap-2">
                    <span className="truncate">{getPersonWorkType(selectedPerson)}</span>
                    <span className="text-[#C96800]">|</span>
                    <span className="truncate">{getPersonOccupation(selectedPerson)}</span>
                    <span className="text-[#C96800]">|</span>
                    <span className="truncate">{getPersonTeam(selectedPerson)}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentYearVihars.length > 0 ? (
                  currentYearVihars.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-[#FFF7E2] rounded-2xl p-3 border border-[#F5E5B0]"
                    >
                      <p className="text-xs text-[#8B6525]">
                        Vihar No. {entry.viharNo}
                      </p>
                      <p className="font-black text-sm text-[#3D1F00]">
                        {entry.from} → {entry.to}
                      </p>
                      <p className="text-xs text-[#8B6525] mt-1">
                        {entry.date} · {entry.km} km
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-sm text-[#8B6525]">
                    No {yearLabel} vihar records found for this person.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4">
              <p className="font-black text-sm text-[#C96800] mb-3">
                Profile Details
              </p>
              <div className="space-y-3">
                {getDetailKeys(selectedPerson).map((key) => {
                  const value = getDisplayValue(selectedPerson, key);
                  if (!value) return null;
                  return (
                    <div key={key} className="flex gap-2">
                      <span className="text-xs font-bold text-[#8B6525] w-24 flex-shrink-0">
                        {key}
                      </span>
                      <span className="text-xs text-[#3D1F00] font-semibold flex-1">
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
