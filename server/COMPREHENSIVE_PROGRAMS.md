# Comprehensive MUT Programs List

## ✅ Complete List of All Programs Added

This database now contains **150+ programs** across all 8 schools at Murang'a University of Technology.

### 📚 Programs by School

#### 1. **School of Engineering & Technology (SET)** - 33 Programs
- **Electrical & Electronics**: 10 programs (PhD to TVET)
  - BSc (5 years), BTech (4 years), BTech Ed (4 years)
  - Multiple diploma options (Power, Telecommunications)
  - TVET certificates

- **Mechanical & Mechatronic**: 13 programs
  - Including Automotive Engineering
  - Plant and Production options
  - Welding & Fabrication TVET

- **Civil & Environmental**: 10 programs
  - BSc (5 years), BTech (4 years), BTech Ed (4 years)
  - Construction Management, Quantity Surveying
  - Building Construction diplomas

#### 2. **School of Computing & IT (SCIT)** - 21 Programs
- **Computer Science**: 7 programs
  - Data Science, Cyber Security
- **Information Technology**: 9 programs
  - BBIT, Information Systems
- **Software Engineering**: 5 programs
  - Mobile App Development, Web Development

#### 3. **School of Business & Economics (SBE)** - 27 Programs
- **Business Management**: 11 programs
  - MBA with specializations
  - HRM, Marketing, Entrepreneurship
- **Economics & Finance**: 11 programs
  - Financial Economics, Accounting
- **Supply Chain**: 5 programs
  - Logistics & Transport Management

#### 4. **School of Pure, Applied & Health Sciences (SPAHS)** - 26 Programs
- **Mathematics**: 8 programs
  - Actuarial Science, Statistics
- **Physical & Biological Sciences**: 12 programs
  - Chemistry (Analytical, Industrial, Biochemistry)
  - Biology, Microbiology
- **Medical Laboratory**: 6 programs
  - Public Health, Environmental Health

#### 5. **School of Education, Humanities & Social Sciences (SOEHSS)** - 16 Programs
- **Education**: 9 programs
  - Science, Arts, Technology, Early Childhood
- **Humanities**: 7 programs
  - Criminology, Journalism, Communication

#### 6. **School of Hospitality & Tourism (SHTM)** - 13 Programs
- **Hospitality**: 7 programs
  - Hotel Management, Food Science
- **Tourism**: 6 programs
  - Tour Operations, Events Management

#### 7. **School of Agriculture (SAES)** - 10 Programs
- Agricultural Economics, Horticulture, Agribusiness
- Agricultural Extension

#### 8. **School of Nursing Sciences (SNS)** - 6 Programs
- BSc Nursing (Direct Entry & Upgrading)
- Community Health Nursing

---

## 🚀 How to Update Your Database

### Option 1: Update Existing Database
```bash
cd server
npm run db:update-programs
```

This will:
- ✅ Add all new programs
- ✅ Update existing programs if needed
- ✅ Keep your existing data intact

### Option 2: Fresh Installation
```bash
cd server
npm run db:init
```

This will:
- ⚠️ Drop and recreate all tables
- ✅ Add all 150+ programs
- ✅ Seed complete MUT data

---

## 📊 Program Breakdown by Level

| Level | Count | Examples |
|-------|-------|----------|
| **PhD** | 12 | Computer Science, Engineering fields, Education |
| **Masters** | 35+ | MBA, MSc variations, specialized masters |
| **Degree** | 85+ | BSc, BTech, BTech Ed, BBIT, etc. |
| **Diploma** | 45+ | All fields, 2-3 year programs |
| **TVET** | 8+ | Craft & Artisan certificates |

---

## 🔍 New Programs Added

### Engineering Programs (Key Additions):
- ✅ **BSc in Electrical & Electronics (5 years)**
- ✅ **BTech in Electrical & Electronics (4 years)**
- ✅ **BTech Ed in Electrical & Electronics (Education)**
- ✅ **BSc in Mechanical Engineering (5 years)**
- ✅ **BTech in Mechanical Engineering (4 years)**
- ✅ **BTech Ed in Mechanical Engineering**
- ✅ **BSc in Civil Engineering (5 years)**
- ✅ **BTech in Civil Engineering (4 years)**
- ✅ **BTech Ed in Civil Engineering**
- ✅ **BSc in Automotive Engineering**
- ✅ **BSc in Mechatronic Engineering (5 years)**
- ✅ **Construction Management**
- ✅ **Quantity Surveying**

### Computing Programs:
- ✅ **Data Science**
- ✅ **Cyber Security** (Degree & Diploma)
- ✅ **Information Systems**
- ✅ **Mobile Application Development**
- ✅ **Web Development**

### Business Programs:
- ✅ **MBA specializations** (Strategic Management, Project Management)
- ✅ **Marketing**
- ✅ **Entrepreneurship**
- ✅ **Logistics & Transport Management**

### Science Programs:
- ✅ **Pure Mathematics**
- ✅ **Applied Biology**
- ✅ **Microbiology**
- ✅ **Public Health**
- ✅ **Environmental Health**

### Other Programs:
- ✅ **Events Management**
- ✅ **Communication & Public Relations**
- ✅ **Development Studies**
- ✅ **Food Science & Nutrition**
- ✅ **Community Health Nursing**

---

## 🎯 Searchable Registration

The registration page now includes:
- ✅ **Searchable dropdown** for program selection
- ✅ **Real-time filtering** as you type
- ✅ **Shows program code, level, and school**
- ✅ **Fast selection** from 150+ programs

Search by:
- Program name (e.g., "Computer Science")
- Program code (e.g., "BSC-CS")
- School name (e.g., "Engineering")
- Level (e.g., "Masters", "Degree")

---

## 📝 Program Naming Convention

- **BSc** = Bachelor of Science (5 years for Engineering, 4 years for others)
- **BTech** = Bachelor of Technology (4 years)
- **BTech Ed** = Bachelor of Technology in Education (4 years)
- **MSc** = Master of Science
- **PhD** = Doctor of Philosophy
- **Dip** = Diploma
- **TVET** = Technical and Vocational Education Training

---

## ✅ Verification

To verify all programs were added:

```sql
-- Connect to database
psql -U your_user -d mut_study_hub

-- Count programs by school
SELECT 
    s.name as school, 
    COUNT(p.id) as program_count
FROM programs p
JOIN departments d ON p.department_id = d.id
JOIN schools s ON d.school_id = s.id
GROUP BY s.name
ORDER BY program_count DESC;

-- Total programs
SELECT COUNT(*) as total_programs FROM programs;
```

Expected: **150+ programs**

---

## 🎓 All Program Levels Covered

✅ PhD Programs
✅ Masters Programs
✅ Degree Programs (BSc, BTech, BTech Ed, BBIT, BA, etc.)
✅ Diploma Programs
✅ TVET Certificates (Craft & Artisan)

---

## 📞 Support

If you notice any missing programs:
1. Check `server/scripts/comprehensiveMUTPrograms.js`
2. Add the program to the appropriate department
3. Run `npm run db:update-programs`

The database now has the most comprehensive list of MUT programs! 🎉
