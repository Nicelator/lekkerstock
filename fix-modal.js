const fs = require('fs');
let c = fs.readFileSync('src/components/marketplace/AssetModal.tsx', 'utf8');
c = c.replace(
  `import { useSession } from "@/lib/auth-client";`,
  `import { createClient } from "@/lib/supabase/client";`
);
c = c.replace(
  `const { data: session } = useSession();`,
  `const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);`
);
fs.writeFileSync('src/components/marketplace/AssetModal.tsx', c);
console.log('Done');
