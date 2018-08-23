double period_impl(double ptheta, double pphi, int num_events, double energy);

double period(double ptheta, double pphi, int num_events, double energy) {
  return period_impl(ptheta, pphi, num_events, energy);
  // return 13;
}
