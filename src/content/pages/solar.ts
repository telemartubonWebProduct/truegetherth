import type { SolarPage } from "@/lib/content/schema";

import { t } from "../catalog/helpers";

// Imported from the old /wEnergy page (src/components/wEnergy/*, commit
// 87c70d2). Spelling is normalised to โซลาร์เซลล์ and obvious typos are fixed;
// figures and claims are unchanged and listed for the owner to verify.
export const solarPage: SolarPage = {
  id: "solar",
  path: "/wEnergy",
  seo: {
    title: t("ติดตั้งโซลาร์เซลล์ W&W Energy", "W&W Energy rooftop solar installation"),
    description: t(
      "บริการสำรวจ ออกแบบ ติดตั้ง และบำรุงรักษาระบบโซลาร์เซลล์บนหลังคาบ้านและโรงงาน โดย W&W Energy พร้อมแพ็กเกจ 3, 5 และ 10 kWp",
      "Survey, design, installation and maintenance of rooftop solar for homes and factories by W&W Energy, with 3, 5 and 10 kWp packages.",
    ),
  },
  hero: {
    heading: t("บริการติดตั้งโซลาร์เซลล์", "Solar panel installation"),
    description: t(
      "ดำเนินกิจการตามมาตรฐานสากล ISO 9001:2015 บริการสำรวจ ออกแบบ ติดตั้ง และบำรุงรักษาระบบโซลาร์เซลล์",
      "Run to the international ISO 9001:2015 standard: survey, design, installation and maintenance of solar systems.",
    ),
    provider: t("บริการของ W&W Energy", "A W&W Energy service"),
    image: "solar-rooftop",
    cta: {
      id: "solar-hero-consult",
      label: t("ขอคำปรึกษาโซลาร์เซลล์", "Ask about solar"),
      target: { kind: "contact", channel: "line-sales" },
      style: "primary",
    },
    tone: "canvas",
  },
  about: {
    heading: t("สินค้าและบริการ", "Products and services"),
    body: [
      t(
        "บริการติดตั้งระบบโซลาร์เซลล์บนหลังคา (Solar Rooftop System) สำหรับบ้านพักอาศัยและกลุ่มธุรกิจโรงงานอุตสาหกรรม ด้วยสินค้าจากผู้ผลิตชั้นนำของโลก เช่น แผง Mono Crystalline Tier 1 ที่รับประกันประสิทธิภาพยาวนานกว่า 30 ปี และควบคุมด้วยอินเวอร์เตอร์จาก Huawei ซึ่งมียอดขายในตลาดเป็นอันดับ 1 ของโลก",
        "Rooftop solar systems for homes, businesses and factories, built with products from leading manufacturers, such as Tier 1 monocrystalline panels with a performance warranty of more than 30 years, managed by Huawei inverters, the world's best-selling brand.",
      ),
    ],
    image: "solar-products",
    tone: "canvas",
  },
  stats: {
    heading: t("ผลงานของเรา", "Our track record"),
    items: [
      { id: "provinces", value: "77", label: t("จังหวัด", "provinces") },
      { id: "teams", value: "57", label: t("ทีมติดตั้ง", "installation teams") },
      { id: "projects", value: "2,115", label: t("โครงการ", "projects") },
      { id: "capacity", value: "56,304", label: t("กิโลวัตต์ของโซลาร์เซลล์ที่ติดตั้ง", "kW of solar installed") },
    ],
  },
  process: {
    heading: t("ขั้นตอนติดตั้งโซลาร์เซลล์", "How installation works"),
    description: t(
      "Werwind Energy Solar ให้บริการโซลาร์เซลล์แบบครบวงจร ทั้งให้คำปรึกษา สำรวจ คำนวณ และออกแบบการติดตั้งโซลาร์เซลล์ทุกจังหวัดทั่วประเทศ",
      "Werwind Energy Solar offers a complete solar service: advice, site survey, calculation and installation design in every province of Thailand.",
    ),
    image: "solar-aerial",
    steps: [
      { id: "consult", title: t("ปรึกษา", "Consultation"), description: t("ทีมขายผู้เชี่ยวชาญพร้อมให้คำแนะนำเป็นรายบุคคล", "Experienced sales staff give you personal advice.") },
      { id: "survey", title: t("สำรวจ", "Survey"), description: t("ตรวจสอบและเก็บข้อมูลสถานที่ พร้อมรูปถ่ายทางอากาศ", "We inspect and record the site, including aerial photos.") },
      { id: "design", title: t("ออกแบบ", "Design"), description: t("วิศวกรไฟฟ้าและวิศวกรโยธาคำนวณและออกแบบโครงสร้าง", "Electrical and civil engineers calculate and design the structure.") },
      { id: "install", title: t("ติดตั้ง", "Installation"), description: t("ควบคุมงานติดตั้งโซลาร์เซลล์ด้วยทีมงานที่มีประสบการณ์", "Experienced teams carry out and supervise the installation.") },
      { id: "permit", title: t("ขออนุญาต", "Permits"), description: t("ประสานงานเป็นตัวแทนยื่นขออนุญาตกับการไฟฟ้า", "We apply to the electricity authority for you.") },
      { id: "after-sales", title: t("บริการหลังการขาย", "After-sales service"), description: t("ทีม Call Center และทีมวิศวกรพร้อมให้บริการทั่วประเทศ", "Call-centre staff and engineers support you nationwide.") },
    ],
    tone: "canvas",
  },
  packages: {
    id: "solar",
    heading: t("ราคาติดตั้งโซลาร์เซลล์", "Solar installation prices"),
    group: "rooftop",
    packageCta: {
      id: "solar-package-interest",
      label: t("สอบถามแพ็กเกจนี้", "Ask about this package"),
      target: { kind: "contact", channel: "line-sales" },
      style: "primary",
    },
    notes: [
      t(
        "คำนวณจากค่าไฟ 4.7 บาท/หน่วย และใช้งานช่วงกลางวันเฉลี่ย 5 ชั่วโมงต่อวัน",
        "Based on electricity at 4.7 baht a unit and about 5 hours of daytime use a day.",
      ),
      t(
        "เครื่องใช้ไฟฟ้าคำนวณจากแอร์ 9,000 BTU ทีวี 55 นิ้ว และตู้เย็น 12 คิว",
        "Appliances assume a 9,000 BTU air conditioner, a 55-inch TV and a 12-cubic-foot fridge.",
      ),
      t(
        "ราคารวมค่าติดตั้งและค่าขออนุญาตจากการไฟฟ้า ไม่รวม VAT 7% ราคาอาจเปลี่ยนตามพื้นที่ติดตั้งและสภาพหน้างาน",
        "Prices include installation and the electricity-authority permit, exclude 7% VAT and may change with the site and its conditions.",
      ),
      t(
        "ฟรีบริการบำรุงรักษาระบบและล้างทำความสะอาดแผงโซลาร์เซลล์นาน 2 ปี",
        "Free system maintenance and panel cleaning for 2 years.",
      ),
    ],
    tone: "surface",
  },
  bundle: {
    heading: t("ติดตั้งโซลาร์เซลล์วันนี้ รับเน็ตบ้านทรูออนไลน์ฟรี 36 เดือน", "Install solar now and get True Online home internet free for 36 months"),
    description: t("เมื่อติดตั้งโซลาร์เซลล์กับ W&W Energy", "When you install solar with W&W Energy"),
    items: [
      t("ฟรี เน็ตบ้านทรูออนไลน์ (มูลค่า 47,000 บาท)", "Free True Online home internet (worth 47,000 baht)"),
      t("ฟรี ค่าประกันและค่าติดตั้ง (มูลค่า 2,600 บาท)", "Free deposit and installation (worth 2,600 baht)"),
      t("ฟรี ค่าแรกเข้า (มูลค่า 2,000 บาท)", "Free joining fee (worth 2,000 baht)"),
    ],
    image: "true-online-logo",
    tone: "canvas",
  },
  knowledge: {
    heading: t("ความรู้พื้นฐานโซลาร์เซลล์", "Solar basics"),
    articles: [
      {
        id: "what-is-solar",
        title: t("โซลาร์เซลล์คืออะไร", "What is a solar system?"),
        body: [
          t(
            "ระบบโซลาร์เซลล์ (Solar Cell System) เป็นการแปลงแสงอาทิตย์เป็นพลังงานไฟฟ้า ประกอบด้วยแผงโซลาร์เซลล์ (Solar Cell Panel) อินเวอร์เตอร์ (Inverter) และสายไฟที่เชื่อมต่อกันเป็นระบบ แผงโซลาร์เซลล์รับพลังงานแสงอาทิตย์ในรูปของความเข้มแสงเพื่อสร้างไฟฟ้ากระแสตรง (DC) แล้วอินเวอร์เตอร์แปลงไฟฟ้ากระแสตรงเป็นไฟฟ้ากระแสสลับ (AC) จ่ายให้บ้านของคุณร่วมกับไฟฟ้าจากมิเตอร์ของการไฟฟ้า",
            "A solar system turns sunlight into electricity. It is made of solar panels, an inverter and the wiring that connects them. The panels take in sunlight and produce direct current (DC); the inverter converts it to alternating current (AC), which powers your home together with electricity from the utility meter.",
          ),
          t(
            "ระบบนี้เรียกว่าแบบออนกริด (On Grid) เป็นระบบที่นิยมอย่างมากสำหรับบ้านเรือนและโรงงาน เพราะใช้ไฟฟ้าจากโซลาร์เซลล์ในช่วงกลางวัน และเปลี่ยนไปใช้ไฟฟ้าจากมิเตอร์การไฟฟ้าในช่วงกลางคืน",
            "This is called an on-grid system. It is very popular for homes and factories because it uses solar power during the day and switches to the utility supply at night.",
          ),
        ],
        list: [],
        images: ["solar-knowledge-1", "solar-knowledge-2"],
      },
      {
        id: "how-to-install",
        title: t("ติดตั้งโซลาร์เซลล์อย่างไร", "How is solar installed?"),
        body: [
          t(
            "การติดตั้งระบบโซลาร์เซลล์บนหลังคาบ้าน (Solar Rooftop) ต้องวางแผนและเตรียมการอย่างรอบคอบ ควรประเมินสภาพหลังคาทั้งความแข็งแรง ขนาด และทิศของหลังคา เพื่อให้แผงโซลาร์เซลล์ผลิตกระแสไฟได้มากที่สุด การเลือกอุปกรณ์อย่างแผงโซลาร์เซลล์และอินเวอร์เตอร์ก็จำเป็น และสุดท้าย การเลือกบริษัทที่เป็นมืออาชีพและน่าเชื่อถืออย่าง WERWIND Energy เป็นสิ่งสำคัญที่สุด",
            "A rooftop solar installation needs careful planning. The roof's strength, size and direction should be assessed so the panels produce as much power as possible. Choosing the right panels and inverter matters too, and most important of all is choosing a professional, trustworthy installer such as WERWIND Energy.",
          ),
        ],
        list: [],
        images: [],
      },
      {
        id: "site-survey",
        title: t("การสำรวจพื้นที่ติดตั้งโซลาร์เซลล์", "Surveying the site"),
        body: [
          t(
            "ทีมวิศวกร WERWIND Energy ที่ผ่านการรับรองใช้เวลาสำรวจพื้นที่ประมาณ 1–3 ชั่วโมง เริ่มจากบินโดรนถ่ายภาพทางอากาศเพื่อดูชนิดของหลังคา อุปสรรคในการขึ้นหลังคา และทิศของหลังคาที่จะติดตั้งแผง พร้อมประเมินโครงสร้างหลังคาว่ารับน้ำหนักแผงได้",
            "Certified WERWIND Energy engineers spend about 1–3 hours surveying the site. They start with drone photos to see the roof type, anything that makes the roof hard to reach and which way the panel area faces, and assess whether the roof structure can carry the panels.",
          ),
          t(
            "จากนั้นสำรวจจุดติดตั้งอินเวอร์เตอร์และตู้ AC/DC ที่เชื่อมเข้ากับระบบไฟฟ้าของบ้าน และแนวเดินสายไฟ แล้วสอบถามลูกค้าว่าต้องการให้ติดตั้งตรงไหนให้สวยงามและระบบทำงานได้มีประสิทธิภาพที่สุด",
            "Next they check where the inverter and the AC/DC cabinet will connect to the house wiring and how the cables will run, then agree with you on placements that look right and let the system work at its best.",
          ),
        ],
        list: [],
        images: ["solar-knowledge-3", "solar-knowledge-4"],
      },
      {
        id: "design",
        title: t("การเขียนแบบโซลาร์เซลล์", "Designing the system"),
        body: [
          t(
            "หลังสำรวจเสร็จ ทีมสำรวจส่งข้อมูลให้วิศวกรระบบโซลาร์เซลล์ของ WERWIND Energy ออกแบบด้วยโปรแกรมที่ได้รับการรับรองมาตรฐานระดับโลก โดยคำนวณน้ำหนักและความแข็งแรงของหลังคา และทิศทางการติดตั้งที่ผลิตไฟฟ้าได้มากที่สุด",
            "After the survey, the data goes to WERWIND Energy's solar engineers, who design the system with internationally certified software. They calculate the roof's load and strength and the mounting direction that produces the most power.",
          ),
          t(
            "ทิศที่เหมาะสมในประเทศไทยคือทิศใต้ เพราะดวงอาทิตย์ขึ้นทางทิศตะวันออก ตกทางทิศตะวันตก และโคจรอ้อมไปทางทิศใต้ระหว่างวัน จึงรับแสงรวมทั้งวันได้มากที่สุด นอกจากนี้ยังคัดเลือกอุปกรณ์จับยึดที่ได้มาตรฐานและเหมาะกับหลังคาของลูกค้า ขั้นตอนออกแบบใช้เวลา 1–2 วันก่อนเริ่มติดตั้ง",
            "In Thailand the best direction is south: the sun rises in the east, sets in the west and arcs to the south during the day, so a south-facing roof gets the most light. The team also picks certified mounting hardware that suits your roof. Design takes 1–2 days before installation starts.",
          ),
        ],
        list: [],
        images: [],
      },
      {
        id: "panel-installation",
        title: t("การติดตั้งแผงโซลาร์เซลล์บนหลังคา", "Installing the panels"),
        body: [
          t(
            "การติดตั้งเริ่มจากเตรียมนั่งร้านหรือบันไดขึ้นหลังคา ทีมติดตั้งของ WERWIND Energy ทุกคนผ่านการอบรมการทำงานบนที่สูง (Working at Height) และสวมอุปกรณ์ป้องกัน เช่น เข็มขัดนิรภัยแบบเต็มตัว ก่อนติดตั้งอุปกรณ์จับยึดแผงบนหลังคาตามแบบที่วางไว้",
            "Installation starts with scaffolding or a ladder to the roof. Every WERWIND Energy installer is trained for working at height and wears protective equipment such as a full-body harness before fitting the panel mounts to the roof as designed.",
          ),
          t(
            "ระบบ String Inverter เชื่อมต่อแผงเข้าด้วยกันผ่านสายไฟและหัวเชื่อมต่อ MC4 ที่ได้มาตรฐาน แล้วร้อยท่อสายไฟลงด้านล่างของบ้านเพื่อต่อเข้ากับอินเวอร์เตอร์ ส่วนระบบ Microinverter ทีมจะติดตั้ง Microinverter ใต้แผงบนหลังคาก่อน แล้วต่อสายไฟเข้าที่ Microinverter ได้โดยตรง",
            "With a string inverter, the panels are linked with standard MC4 connectors and the cables run in conduit down to the inverter inside. With microinverters, a microinverter is fitted under each panel on the roof and the panels connect to it directly.",
          ),
        ],
        list: [],
        images: ["solar-knowledge-5", "solar-knowledge-6"],
      },
      {
        id: "inverter",
        title: t("การติดตั้งระบบอินเวอร์เตอร์", "Installing the inverter"),
        body: [
          t(
            "อินเวอร์เตอร์ (Inverter) แปลงไฟฟ้ากระแสตรง (DC) จากแผงโซลาร์เซลล์บนหลังคาเป็นไฟฟ้ากระแสสลับ (AC) 220V ที่ใช้ในบ้าน และเชื่อมต่อกับไฟฟ้าจากมิเตอร์ของการไฟฟ้าผ่านตู้ AC/DC Combiner ที่ติดตั้งบริเวณเดียวกับอินเวอร์เตอร์ ภายในตู้ต่อกับเบรกเกอร์และระบบกราวด์เพื่อป้องกันไฟฟ้าลัดวงจร",
            "The inverter converts the panels' direct current (DC) into the 220 V alternating current (AC) used at home, and connects to the utility supply through an AC/DC combiner box installed next to it. The box contains breakers and earthing to protect against short circuits.",
          ),
        ],
        list: [],
        images: [],
      },
      {
        id: "commissioning",
        title: t("การตรวจสอบระบบโซลาร์เซลล์", "Testing the system"),
        body: [
          t(
            "ขั้นตอนสุดท้ายก่อนเริ่มใช้งานเรียกว่า Commissioning Process คือการทดสอบระบบก่อนใช้งาน โดยตรวจสอบและตั้งค่าบนแอปพลิเคชันของอินเวอร์เตอร์ อินเวอร์เตอร์ Huawei ใช้แอป FusionSolar ซึ่งดูข้อมูลการผลิตไฟฟ้าได้แบบเรียลไทม์ ทั้งปริมาณไฟฟ้าที่แผงผลิตและการใช้ไฟของเครื่องใช้ในบ้าน และแจ้งเตือนเมื่อพบความผิดปกติ ทำให้แก้ไขปัญหาได้ทันที",
            "The last step before you start using the system is commissioning: testing and configuring it in the inverter's app. Huawei inverters use the FusionSolar app, which shows production in real time, both what the panels generate and what your appliances use, and raises an alarm when something is wrong so it can be fixed straight away.",
          ),
        ],
        list: [],
        images: ["solar-knowledge-7", "solar-knowledge-8"],
      },
      {
        id: "maintenance",
        title: t("การบำรุงรักษาระบบโซลาร์เซลล์", "Maintaining the system"),
        body: [
          t(
            "การบำรุงรักษาโซลาร์เซลล์บนหลังคาทำได้ง่ายและไม่แพงอย่างที่หลายคนคิด ควรทำความสะอาดแผงอย่างน้อยปีละ 1 ครั้ง เพราะฝุ่น สิ่งสกปรก และใบไม้ทำให้ผลิตไฟฟ้าได้น้อยลง ใช้ผ้าสะอาดและสายยางฉีดน้ำได้ แต่ควรหลีกเลี่ยงสารเคมีรุนแรงที่อาจทำลายผิวแผง",
            "Rooftop solar is easier and cheaper to maintain than most people think. Clean the panels at least once a year, because dust, dirt and leaves reduce production. A clean cloth and a hose are enough; avoid harsh chemicals that can damage the panel surface.",
          ),
          t(
            "ควรให้วิศวกรผู้เชี่ยวชาญตรวจสายไฟและจุดเชื่อมต่อเป็นระยะ เพราะสายไฟที่สึกกร่อนอาจเกิดอันตรายหรือทำให้ระบบทำงานผิดปกติ WERWIND Energy รับประกันการดูแลส่วนนี้ 2 ปี รวมถึงตรวจความผิดปกติในการใช้งานโดยวิศวกรผู้เชี่ยวชาญ ขั้นตอนทำความสะอาดและตรวจเช็กมีดังนี้",
            "Have an engineer check the wiring and connections from time to time, since worn wiring can be dangerous or make the system misbehave. WERWIND Energy covers this care for 2 years, including fault checks by its engineers. The cleaning and inspection routine is:",
          ),
        ],
        list: [
          t("ตรวจรอยแตกร้าวของแผง (ด้วยสายตา/รูปถ่าย): หากต้องเปลี่ยน อยู่ในเงื่อนไขการรับประกันของผู้ผลิต", "Check the panels for cracks (visually or by photo); replacements fall under the manufacturer's warranty."),
          t("ตรวจสภาพโครงสร้างแผงทั้งหมด (ด้วยสายตา/รูปถ่าย): ตรวจอุปกรณ์จับยึดแผง", "Check the whole panel structure (visually or by photo), including the mounts."),
          t("ตรวจสายไฟทั้งหมดว่าไม่ย้อยหรือหย่อน (ด้วยสายตา/รูปถ่าย): จัดเก็บให้อยู่ในตำแหน่งที่ถูกต้อง", "Check that no cable sags or hangs loose (visually or by photo), and route cables correctly."),
          t("ตรวจความแน่นของขั้วสายไฟ (สัมผัส/จับโยก): ป้องกันการอาร์กของกระแสไฟฟ้า", "Check that terminals are tight (by touch) to prevent arcing."),
          t("ตรวจอินเวอร์เตอร์และอุปกรณ์ไฟฟ้าอื่น (มัลติมิเตอร์วัดกระแส/แรงดัน): ตรวจสถานะการทำงานและทำความสะอาด", "Check the inverter and other electrical equipment with a multimeter, and clean them."),
          t("ตรวจอุปกรณ์ป้องกันไฟฟ้า เบรกเกอร์ และฟิวส์ (มัลติมิเตอร์): ตรวจสถานะการทำงานและทำความสะอาด", "Check protective devices, breakers and fuses with a multimeter, and clean them."),
          t("ตรวจค่าทอร์กของน็อตจับยึด Mounting และขันให้แน่นตามมาตรฐาน 13–15 นิวตันเมตร", "Check the mounting bolts and tighten them to the standard 13–15 N·m."),
          t("ตรวจเซ็นเซอร์อุณหภูมิ (Meteorological Station) ระบบมอนิเตอร์ และระบบควบคุม: ตรวจสถานะและทำความสะอาด", "Check the weather sensors, monitoring and control systems, and clean them."),
          t("ตรวจการต่อสายดินด้วย Earth Tester: ป้องกันแรงดันไฟฟ้าเกินที่ทำให้อุปกรณ์เสียหาย", "Test the earthing with an earth tester to prevent over-voltage damage."),
          t("ตรวจความร้อนของแผงและระบบด้วย Thermoscan: วัดอุณหภูมิของอุปกรณ์ในระบบ", "Scan panels and equipment with a thermal camera to measure their temperature."),
          t("ทดสอบความผิดปกติของแผงด้วย I-V Curve Test: วิเคราะห์สาเหตุเมื่อการผลิตไฟฟ้าลดลง", "Run an I-V curve test to find the cause when production drops."),
        ],
        images: [],
      },
    ],
    tone: "canvas",
  },
};
