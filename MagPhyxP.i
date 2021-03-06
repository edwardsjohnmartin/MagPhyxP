/* magphyxp.i */
 %module magphyxp
 %{
 /* Put header files here or function declarations like below */
 extern double period(double ptheta, double pphi, int num_events, double energy);
struct Minimum {
  double ptheta;
  double pphi;
  double energy;
  double f;
  double t;
  int ptheta_rocking_number;
  int pphi_rocking_number;
  int rocking_in_phase;
  int theta_crossings;
  int phi_crossings;
  int beta_crossings;
};

extern Minimum calculate_min(double ptheta, double pphi, int num_events, double energy, double step_size, int vary, double sim_step_size);
 %}
 
 extern double period(double ptheta, double pphi, int num_events, double energy);
struct Minimum {
  double ptheta;
  double pphi;
  double energy;
  double f;
  double t;
  int ptheta_rocking_number;
  int pphi_rocking_number;
  int rocking_in_phase;
  int theta_crossings;
  int phi_crossings;
  int beta_crossings;
};
extern Minimum calculate_min(double ptheta, double pphi, int num_events, double energy, double step_size, int vary, double sim_step_size);
