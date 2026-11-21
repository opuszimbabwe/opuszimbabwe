/** Cloudflare Registrar handles international domains; local domains remain assisted. */
export default function CloudflareDomainCredit({dark=false}:{dark?:boolean}) {
 return <p data-cloudflare-domains="" style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:8,marginTop:12,fontSize:12,lineHeight:'20px',color:dark?'rgba(255,255,255,.8)':'#716b79'}}>
  <span>International domains via</span>
  <span style={{display:'inline-flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
   <img src="/images/tools/cloudflare-domains.svg" width="44" height="20" alt="" aria-hidden="true" style={{display:'block',width:44,height:20}}/>
   <span style={{fontSize:14,fontWeight:600}}>Cloudflare</span>
  </span>
 </p>;
}
