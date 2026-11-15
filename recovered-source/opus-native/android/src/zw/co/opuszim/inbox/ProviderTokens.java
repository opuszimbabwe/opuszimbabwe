package zw.co.opuszim.inbox;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import androidx.browser.trusted.Token;
import androidx.browser.trusted.TokenStore;
final class ProviderTokens implements TokenStore {
 private final SharedPreferences prefs;
 ProviderTokens(Context context){prefs=context.getSharedPreferences("trusted-provider",Context.MODE_PRIVATE);}
 public void store(Token token){SharedPreferences.Editor e=prefs.edit();if(token==null)e.remove("token");else e.putString("token",Base64.encodeToString(token.serialize(),Base64.NO_WRAP));e.commit();}
 public Token load(){String value=prefs.getString("token",null);try{return value==null?null:Token.deserialize(Base64.decode(value,Base64.NO_WRAP));}catch(Exception e){return null;}}
}
