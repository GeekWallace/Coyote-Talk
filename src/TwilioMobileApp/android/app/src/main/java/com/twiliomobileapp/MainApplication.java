package com.twiliomobileapp;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.PackageList;
import com.twiliovoicereactnative.VoiceApplicationProxy;

import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final VoiceApplicationProxy voiceApplicationProxy =
      new VoiceApplicationProxy(this);

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = new PackageList(this).getPackages();
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    voiceApplicationProxy.onCreate();
  }

  @Override
  public void onTerminate() {
    voiceApplicationProxy.onTerminate();
    super.onTerminate();
  }
}
