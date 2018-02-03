#include "VoyageCalculator.h"

using json = nlohmann::json;

namespace VoyageTools
{

double Crew::score(const char *skill, const char *primarySkill, const char *secondarySkill) const noexcept
{
    // TODO: tweak this scoring algorithm (used for presorting the roster per-skill)
    return command_skill + science_skill + security_skill + engineering_skill + diplomacy_skill + medicine_skill +
           get(skill) * 3 + get(primarySkill) * 2.5 + get(secondarySkill) * 1.5;
}

int16_t Crew::get(const char *skillName) const noexcept
{
    switch (skillName[0])
    {
    case 'c':
        return command_skill;
    case 'e':
        return engineering_skill;
    case 'd':
        return diplomacy_skill;
    case 'm':
        return medicine_skill;
    case 's':
        return skillName[1] == 'c' ? science_skill : security_skill;
    default:
        return -1;
    }
}

const std::array<Crew, SEARCH_DEPTH> &SortedCrew::get(const char *skillName) const noexcept
{
    switch (skillName[0])
    {
    case 'c':
        return command_skill;
    case 'e':
        return engineering_skill;
    case 'd':
        return diplomacy_skill;
    case 'm':
        return medicine_skill;
    case 's':
        return skillName[1] == 'c' ? science_skill : security_skill;
    default:
        assert(false);
    }
}

VoyageCalculator::VoyageCalculator(std::istream &stream) noexcept
{
    stream >> j;
    primarySkill = j["voyage_skills"]["primary_skill"];
    secondarySkill = j["voyage_skills"]["secondary_skill"];
    shipAntiMatter = j["shipAM"];
    assert(SLOT_COUNT == j["voyage_crew_slots"].size());

    for (const auto &crew : j["crew"])
    {
        if (crew["frozen"] != 0)
            continue;

        Crew c;
        c.id = crew["id"];
        c.command_skill = crew["command_skill"]["core"].get<int16_t>() + (crew["command_skill"]["max"].get<int16_t>() - crew["command_skill"]["min"].get<int16_t>()) / 2;
        c.science_skill = crew["science_skill"]["core"].get<int16_t>() + (crew["science_skill"]["max"].get<int16_t>() - crew["science_skill"]["min"].get<int16_t>()) / 2;
        c.security_skill = crew["security_skill"]["core"].get<int16_t>() + (crew["security_skill"]["max"].get<int16_t>() - crew["security_skill"]["min"].get<int16_t>()) / 2;
        c.engineering_skill = crew["engineering_skill"]["core"].get<int16_t>() + (crew["engineering_skill"]["max"].get<int16_t>() - crew["engineering_skill"]["min"].get<int16_t>()) / 2;
        c.diplomacy_skill = crew["diplomacy_skill"]["core"].get<int16_t>() + (crew["diplomacy_skill"]["max"].get<int16_t>() - crew["diplomacy_skill"]["min"].get<int16_t>()) / 2;
        c.medicine_skill = crew["medicine_skill"]["core"].get<int16_t>() + (crew["medicine_skill"]["max"].get<int16_t>() - crew["medicine_skill"]["min"].get<int16_t>()) / 2;
        roster.emplace_back(std::move(c));
    }

    std::partial_sort_copy(roster.begin(), roster.end(), sortedRoster.command_skill.begin(), sortedRoster.command_skill.end(),
                           [&](Crew i, Crew j) { return (i.score("command_skill", primarySkill.c_str(), secondarySkill.c_str()) > j.score("command_skill", primarySkill.c_str(), secondarySkill.c_str())); });

    std::partial_sort_copy(roster.begin(), roster.end(), sortedRoster.science_skill.begin(), sortedRoster.science_skill.end(),
                           [&](Crew i, Crew j) { return (i.score("science_skill", primarySkill.c_str(), secondarySkill.c_str()) > j.score("science_skill", primarySkill.c_str(), secondarySkill.c_str())); });

    std::partial_sort_copy(roster.begin(), roster.end(), sortedRoster.security_skill.begin(), sortedRoster.security_skill.end(),
                           [&](Crew i, Crew j) { return (i.score("security_skill", primarySkill.c_str(), secondarySkill.c_str()) > j.score("security_skill", primarySkill.c_str(), secondarySkill.c_str())); });

    std::partial_sort_copy(roster.begin(), roster.end(), sortedRoster.engineering_skill.begin(), sortedRoster.engineering_skill.end(),
                           [&](Crew i, Crew j) { return (i.score("engineering_skill", primarySkill.c_str(), secondarySkill.c_str()) > j.score("engineering_skill", primarySkill.c_str(), secondarySkill.c_str())); });

    std::partial_sort_copy(roster.begin(), roster.end(), sortedRoster.diplomacy_skill.begin(), sortedRoster.diplomacy_skill.end(),
                           [&](Crew i, Crew j) { return (i.score("diplomacy_skill", primarySkill.c_str(), secondarySkill.c_str()) > j.score("diplomacy_skill", primarySkill.c_str(), secondarySkill.c_str())); });

    std::partial_sort_copy(roster.begin(), roster.end(), sortedRoster.medicine_skill.begin(), sortedRoster.medicine_skill.end(),
                           [&](Crew i, Crew j) { return (i.score("medicine_skill", primarySkill.c_str(), secondarySkill.c_str()) > j.score("medicine_skill", primarySkill.c_str(), secondarySkill.c_str())); });

    for (int i = 0; i < SLOT_COUNT; i++)
    {
        slotRoster[i] = &sortedRoster.get(j["voyage_crew_slots"][i]["skill"].get<std::string>().c_str());
    }
}

void VoyageCalculator::fillSlot(size_t slot) noexcept
{
    for (const auto &crew : *slotRoster[slot])
    {
        if (slot == 0)
        {
            std::cout << "Processing " << crew.id << "\n";
        }

        bool alreadyIn = false;
        for (size_t i = 0; i < slot; i++)
        {
            if (considered[i]->id == crew.id)
            {
                alreadyIn = true;
                break;
            }
        }

        if (alreadyIn)
            continue;

        considered[slot] = &crew;

        if (slot < SLOT_COUNT - 1)
        {
            fillSlot(slot + 1);
        }
        else
        {
            // we have a complete crew complement, compute score
            //TODO: traits for slot
            double score = calculateDuration(considered);

            if (score > bestscore)
            {
                bestconsidered = considered;
                bestscore = score;
            }
        }

        considered[slot] = nullptr;
    }
}

double VoyageCalculator::calculateDuration(std::array<const Crew *, SLOT_COUNT> complement) noexcept
{
    int32_t shipAM = shipAntiMatter;
    Crew totals;
    for (const auto &crew : complement)
    {
        totals.command_skill += crew->command_skill;
        totals.science_skill += crew->science_skill;
        totals.security_skill += crew->security_skill;
        totals.engineering_skill += crew->engineering_skill;
        totals.diplomacy_skill += crew->diplomacy_skill;
        totals.medicine_skill += crew->medicine_skill;

        if (crew->hasTrait)
        {
            shipAM += 25;
        }
    }

    // This is using Chewable C++'s values from here https://docs.google.com/spreadsheets/d/1IS2qEggZKo1P1kBJq-qoDxJvxtKfQXpfVna9z4E_dNo/edit#gid=0
    auto H3 = 560;          // Cycle Length (s)
    auto H4 = 6.4286;       // Cycles Per Hour
    auto H5 = 6;            // Hazards/cycle
    auto H6 = 18;           // Activity/cycle
    auto H7 = 0.5;          // Dilemmas/hr
    auto H8 = 38.0714;      // Hazards/hr
    auto H9 = 1246;         // Hazard Diff/hr
    auto H10 = 5;           // Hazard AM Pass
    auto H11 = 30;          // Hazard AM Fail
    auto H12 = 115.7142857; // AM/hour cost
    auto H13 = 0.35;        // Pri. Skill Chance
    auto H14 = 0.25;        // Sec. Skill Chance
    auto H15 = 0.1;         // Other Skill Chance

    auto PrimarySkill = totals.get(primarySkill.c_str());
    auto SecondarySkill = totals.get(secondarySkill.c_str());
    auto OtherSkills = 0;
    auto MaxSkill = 0;

    // TODO: lots of repetition here, JS code is cleaner; perhaps templates?
    if ((totals.command_skill != PrimarySkill) && (totals.command_skill != SecondarySkill))
    {
        OtherSkills += totals.command_skill;
    }
    if (totals.command_skill > MaxSkill)
    {
        MaxSkill = totals.command_skill;
    }

    if ((totals.science_skill != PrimarySkill) && (totals.science_skill != SecondarySkill))
    {
        OtherSkills += totals.science_skill;
    }
    if (totals.science_skill > MaxSkill)
    {
        MaxSkill = totals.science_skill;
    }

    if ((totals.security_skill != PrimarySkill) && (totals.security_skill != SecondarySkill))
    {
        OtherSkills += totals.security_skill;
    }
    if (totals.security_skill > MaxSkill)
    {
        MaxSkill = totals.security_skill;
    }

    if ((totals.engineering_skill != PrimarySkill) && (totals.engineering_skill != SecondarySkill))
    {
        OtherSkills += totals.engineering_skill;
    }
    if (totals.engineering_skill > MaxSkill)
    {
        MaxSkill = totals.engineering_skill;
    }

    if ((totals.diplomacy_skill != PrimarySkill) && (totals.diplomacy_skill != SecondarySkill))
    {
        OtherSkills += totals.diplomacy_skill;
    }
    if (totals.diplomacy_skill > MaxSkill)
    {
        MaxSkill = totals.diplomacy_skill;
    }

    if ((totals.medicine_skill != PrimarySkill) && (totals.medicine_skill != SecondarySkill))
    {
        OtherSkills += totals.medicine_skill;
    }
    if (totals.medicine_skill > MaxSkill)
    {
        MaxSkill = totals.medicine_skill;
    }

    auto AMGained = shipAM + (PrimarySkill * H13 + SecondarySkill * H14 + OtherSkills * H15) / H9 * H8 * H10;
    auto AMVariableHaz = ((MaxSkill - PrimarySkill) * H13 + (MaxSkill - SecondarySkill) * H14 + (MaxSkill * 4 - OtherSkills) * H15) / H9 * H8 * H11;
    auto AMLeft = AMGained - AMVariableHaz - MaxSkill / H9 * H12;
    auto TimeLeft = AMLeft / (H8 * H11 + H12);

    return MaxSkill / H9 + TimeLeft;
}

} //namespace VoyageTools