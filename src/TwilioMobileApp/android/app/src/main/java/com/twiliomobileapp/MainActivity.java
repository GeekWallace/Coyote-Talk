package com.twiliomobileapp;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.twiliovoicereactnative.VoiceActivityProxy;

public class MainActivity extends ReactActivity {
  private final VoiceActivityProxy activityProxy = new VoiceActivityProxy(this);

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    activityProxy.onCreate(savedInstanceState);
  }

  @Override
  protected void onStart() {
    super.onStart();
    activityProxy.onStart();
  }

  @Override
  protected void onStop() {
    activityProxy.onStop();
    super.onStop();
  }

  @Override
  protected void onNewIntent(Intent intent) {
    activityProxy.onNewIntent(intent);
    super.onNewIntent(intent);
  }

  @Override
  protected void onDestroy() {
    activityProxy.onDestroy();
    super.onDestroy();
  }

  @Override
  protected String getMainComponentName() {
    return "main";
  }
}
