import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import dataflowLogo from "@/assets/dataflow-logo.png";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Cloud,
  MailCheck,
  MapPin,
  DatabaseZap,
  UserCheck,
  ShieldBan,
  PhoneOff,
  Ban,
  Globe,
  DollarSign,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const services = [
  {
    icon: MailCheck,
    title: "Data Validation*",
    desc: "Industry-leading email and phone verification is automatically applied to every record you bring into DataFlow. Our validation engine is among the most accurate available—essential for outbound email campaigns and contact centres.",
  },
  {
    icon: MapPin,
    title: "GEO Completion",
    desc: "Automatically enrich incoming records with location details (city, state, zip, country) derived from their associated IP addresses—at no extra cost.",
  },
  {
    icon: DatabaseZap,
    title: "Data Append",
    desc: "Fill in missing fields on new records by cross-referencing data already stored in your account—completely free of charge.",
  },
  {
    icon: UserCheck,
    title: "Gender Append",
    desc: "Automatically tag each record with a gender (Male or Female) based on the first name field—included at no additional cost.",
  },
  {
    icon: ShieldBan,
    title: "Suppression",
    desc: "Filter incoming records against your organisation's master suppression list or individual client-level suppression files to keep your data clean.",
  },
  {
    icon: PhoneOff,
    title: "Litigator Phone Scrub",
    desc: "Automatically block incoming leads whose phone numbers appear in an extensive database of known TCPA litigators, serial complainers, and anti-telemarketing organisations.",
  },
  {
    icon: Ban,
    title: "Bad Words Scrub",
    desc: "Screen and reject records that contain common profane or inappropriate language in the first or last name fields.",
  },
  {
    icon: Globe,
    title: "IP Address Validation",
    desc: "Verify that incoming IP addresses (both V4 and V6) conform to correct formatting standards, and reject any records with malformed addresses.",
  },
];

const LearnMore = () => (
  <div className="min-h-screen bg-background">
    {/* Sticky nav */}
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/">
          <img src={dataflowLogo} alt="DataFlow" className="h-12" />
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>
    </nav>

    <main className="container max-w-4xl pt-28 pb-20 space-y-24">
      {/* ── Section 1: What is DataFlow? ── */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            What is <span className="gradient-text">DataFlow</span>?
          </h1>
        </div>

        <p className="text-foreground/80 leading-relaxed text-lg">
          DataFlow is a powerful, cloud-native data management platform designed
          to streamline how you handle consumer data—commonly known as leads. It
          allows you to seamlessly import, store, distribute, and track your data
          through an intuitive interface built with user experience at its core.
          Beyond simple management, DataFlow features a robust API builder that
          enables you to push your data to virtually any destination with ease.
        </p>
        <p className="text-foreground/80 leading-relaxed text-lg">
          The platform empowers you to create complex, multi-layered data flows
          that connect to a wide range of external systems, all while maintaining
          complete visibility into exactly where your information is being routed
          at any given moment.
        </p>
      </motion.section>

      {/* ── Section 2: Built-in Services ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
        custom={0}
        className="space-y-8"
      >
        <h2 className="font-display text-2xl sm:text-3xl font-bold">
          Integrated Services
        </h2>

        <div className="grid sm:grid-cols-2 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              className="glass-card rounded-xl p-6 space-y-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              custom={i}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground italic">
          *Standard email and phone verification is provided at no cost. Enhanced
          premium validation for phone and email is an optional paid add-on,
          billed separately from your regular DataFlow subscription.
        </p>
      </motion.section>

      {/* ── Section 3: Pricing ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        custom={0}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            Understanding DataFlow Pricing
          </h2>
        </div>

        <p className="text-foreground/80 leading-relaxed text-lg">
          We've put together a comprehensive guide that breaks down every aspect
          of DataFlow's pricing model.{" "}
          <a
            href="#"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Read the full details here
          </a>
          .
        </p>
      </motion.section>
    </main>

    <Footer />
  </div>
);

export default LearnMore;
