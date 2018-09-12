struct Minimum {
  double ptheta;
  double pphi;
  double f;
};

double period_impl(double ptheta, double pphi, int num_events, double energy);
Minimum calculate_min_impl(double ptheta, double pphi, int num_events, double energy, double step_size);

double period(double ptheta, double pphi, int num_events, double energy) {
  return period_impl(ptheta, pphi, num_events, energy);
  // return 13;
}

Minimum calculate_min(double ptheta, double pphi,
                      int num_events, double energy, double step_size) {
  return calculate_min_impl(ptheta, pphi, num_events, energy, step_size);
}
